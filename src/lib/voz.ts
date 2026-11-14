// Fala -> texto e texto -> voz.
// Dois motores de transcrição, ambos gratuitos:
//  - "navegador": Web Speech API (Chrome/Android usa o Google; Safari/iPhone usa o ditado da Apple). Precisa de internet.
//  - "aparelho": Whisper rodando no próprio celular (transcricaoLocal.ts). Igual no iPhone e no Android, funciona sem internet.
// "auto" usa o navegador quando existe e cai para o aparelho quando falta suporte ou internet.
import { ehIOS, suporta } from './plataforma'
import {
  abrirMicrofone,
  gravar,
  limparTranscricao,
  paraPCM16k,
  prepararModelo,
  transcrever,
  volume,
} from './transcricaoLocal'

export type Motor = 'auto' | 'navegador' | 'aparelho'
const CHAVE_MOTOR = 'sinalume:motor-fala'

export function motorPreferido(): Motor {
  try {
    const m = localStorage.getItem(CHAVE_MOTOR)
    return m === 'navegador' || m === 'aparelho' ? m : 'auto'
  } catch {
    return 'auto'
  }
}

export function definirMotor(m: Motor) {
  try {
    localStorage.setItem(CHAVE_MOTOR, m)
  } catch {
    /* ignore */
  }
}

export function motorEfetivo(): 'navegador' | 'aparelho' {
  const p = motorPreferido()
  if (p === 'aparelho') return 'aparelho'
  if (!suporta.reconhecimentoNavegador()) return 'aparelho'
  if (p === 'auto' && !navigator.onLine) return 'aparelho'
  return 'navegador'
}

/** Há algum jeito de transcrever fala neste aparelho? */
export const falaSuportada = (): boolean => suporta.reconhecimentoNavegador() || suporta.gravacaoAudio()

export interface OpcoesEscuta {
  continuo: boolean
  aoParcial: (texto: string) => void
  aoFinal: (texto: string) => void
  aoErro?: (mensagem: string) => void
  aoTerminar?: () => void
  /** aviso de estado (ex.: "Baixando modelo de fala… 40%") */
  aoEstado?: (texto: string) => void
}

/** Inicia a escuta no motor escolhido. Retorna uma função para parar. */
export function escutar(op: OpcoesEscuta): () => void {
  return motorEfetivo() === 'aparelho' ? escutarNoAparelho(op) : escutarNoNavegador(op)
}

// ---------------------------------------------------------------- motor do navegador

interface ResultadoFala {
  isFinal: boolean
  0: { transcript: string }
}
interface Reconhecedor {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<ResultadoFala> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

const MENSAGENS_ERRO: Record<string, string> = {
  'not-allowed': 'Permita o uso do microfone para o Sinalume.',
  'service-not-allowed': 'O ditado está desligado neste aparelho. Ative em Ajustes ou use "Transcrição no aparelho".',
  'no-speech': 'Não ouvi nada. Tente falar mais perto do celular.',
  network: 'Sem internet para a transcrição do navegador. Mudei para a transcrição no aparelho.',
  'audio-capture': 'Nenhum microfone encontrado.',
}

function escutarNoNavegador(op: OpcoesEscuta): () => void {
  const w = window as unknown as { SpeechRecognition?: new () => Reconhecedor; webkitSpeechRecognition?: new () => Reconhecedor }
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition
  if (!C) return escutarNoAparelho(op)

  const ios = ehIOS()
  let ativo = true
  let pararAparelho: (() => void) | null = null
  let ultimoEvento = Date.now()
  let vigia: number | undefined

  const criar = () => {
    const rec = new C()
    rec.lang = 'pt-BR'
    // no iPhone o modo contínuo para de responder em silêncio; usamos sessões curtas e religamos
    rec.continuous = op.continuo && !ios
    rec.interimResults = true
    rec.onresult = (e) => {
      ultimoEvento = Date.now()
      let parcial = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const t = r[0].transcript.trim()
        if (r.isFinal) {
          if (t) op.aoFinal(t)
        } else parcial += t + ' '
      }
      op.aoParcial(parcial.trim())
    }
    rec.onerror = (e) => {
      if (e.error === 'aborted') return
      if (e.error === 'no-speech' && op.continuo) return
      if (e.error === 'network' || e.error === 'service-not-allowed') {
        // sem internet ou ditado desligado: segue no motor do aparelho, sem a pessoa perder a fala
        op.aoErro?.(MENSAGENS_ERRO[e.error])
        ativo = false
        pararAparelho = escutarNoAparelho(op)
        return
      }
      op.aoErro?.(MENSAGENS_ERRO[e.error] ?? `Erro no microfone: ${e.error}`)
    }
    rec.onend = () => {
      if (ativo && op.continuo) {
        try {
          atual = criar()
          atual.start()
          return
        } catch {
          /* segue para terminar */
        }
      }
      if (!pararAparelho) op.aoTerminar?.()
    }
    return rec
  }

  let atual = criar()
  atual.start()
  if (op.continuo && ios) {
    // vigia: o Safari às vezes fica "ouvindo" sem devolver nada; reinicia a sessão
    vigia = window.setInterval(() => {
      if (ativo && Date.now() - ultimoEvento > 12_000) {
        ultimoEvento = Date.now()
        try {
          atual.abort()
        } catch {
          /* onend religa */
        }
      }
    }, 4000)
  }
  return () => {
    ativo = false
    window.clearInterval(vigia)
    pararAparelho?.()
    try {
      atual.stop()
    } catch {
      /* ignore */
    }
  }
}

// ---------------------------------------------------------------- motor do aparelho (Whisper)

const JANELA_CONTINUA_MS = 7000

function escutarNoAparelho(op: OpcoesEscuta): () => void {
  if (!suporta.gravacaoAudio()) {
    op.aoErro?.('Este navegador não grava áudio. Digite o texto.')
    op.aoTerminar?.()
    return () => {}
  }
  let ativo = true
  let stream: MediaStream | null = null
  let gravacaoAtual: ReturnType<typeof gravar> | null = null
  let fila = Promise.resolve()

  const processar = (blob: Blob) => {
    fila = fila.then(async () => {
      try {
        const pcm = await paraPCM16k(blob)
        if (pcm.length < 16000 * 0.4 || volume(pcm) < 0.008) return
        op.aoParcial('Transcrevendo…')
        const texto = limparTranscricao(await transcrever(pcm))
        op.aoParcial('')
        if (texto) op.aoFinal(texto)
      } catch (e) {
        op.aoParcial('')
        op.aoErro?.((e as Error).message)
      }
    })
    return fila
  }

  ;(async () => {
    try {
      if (!(await modeloJaPreparado())) op.aoEstado?.('Preparando a transcrição no aparelho…')
      const prep = prepararModelo()
      stream = await abrirMicrofone()
      if (!ativo) {
        // parou enquanto o navegador pedia permissão: desliga o microfone na hora
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      if (op.continuo) {
        await prep
        op.aoEstado?.('')
        // grava em janelas e transcreve cada uma enquanto a próxima é gravada
        while (ativo && stream) {
          gravacaoAtual = gravar(stream)
          await new Promise((r) => setTimeout(r, JANELA_CONTINUA_MS))
          const blob = await gravacaoAtual.parar()
          void processar(blob)
        }
      } else {
        gravacaoAtual = gravar(stream)
        await prep
        op.aoEstado?.('')
      }
    } catch (e) {
      const nome = (e as Error).name
      op.aoErro?.(nome === 'NotAllowedError' ? MENSAGENS_ERRO['not-allowed'] : (e as Error).message)
      ativo = false
      op.aoTerminar?.()
    }
  })()

  return () => {
    if (!ativo) return
    ativo = false
    const g = gravacaoAtual
    const s = stream
    void (async () => {
      if (g) await processar(await g.parar())
      await fila
      s?.getTracks().forEach((t) => t.stop())
      op.aoTerminar?.()
    })()
  }
}

async function modeloJaPreparado(): Promise<boolean> {
  try {
    const nomes = await caches.keys()
    return nomes.some((n) => n.includes('transformers'))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------- voz (texto -> fala)

let vozPtBr: SpeechSynthesisVoice | null = null
function escolherVoz() {
  const vozes = speechSynthesis.getVoices()
  vozPtBr = vozes.find((v) => v.lang === 'pt-BR') ?? vozes.find((v) => v.lang.startsWith('pt')) ?? null
}
if (typeof speechSynthesis !== 'undefined') {
  escolherVoz()
  speechSynthesis.onvoiceschanged = escolherVoz
}

/**
 * No iPhone, a voz só toca depois de um toque na tela. Chamamos isto no primeiro toque
 * para que a leitura automática das frases funcione depois.
 */
export function desbloquearVoz() {
  if (typeof speechSynthesis === 'undefined') return
  const u = new SpeechSynthesisUtterance(' ')
  u.volume = 0
  speechSynthesis.speak(u)
}

/** Lê o texto em voz alta em português do Brasil. */
export function falar(texto: string, velocidade = 1): void {
  if (typeof speechSynthesis === 'undefined' || !texto) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'pt-BR'
  u.rate = velocidade
  if (vozPtBr) u.voice = vozPtBr
  speechSynthesis.speak(u)
}
