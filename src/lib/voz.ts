// Fala -> texto (Web Speech API) e texto -> voz (speechSynthesis). Ambos gratuitos e embutidos no navegador.

// Tipos mínimos: a Web Speech API ainda não está em todos os lib.dom.d.ts
interface ResultadoFala {
  isFinal: boolean
  0: { transcript: string }
}
interface EventoFala {
  resultIndex: number
  results: ArrayLike<ResultadoFala>
}
interface Reconhecedor {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: EventoFala) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type ConstrutorReconhecedor = new () => Reconhecedor

function construtor(): ConstrutorReconhecedor | null {
  const w = window as unknown as {
    SpeechRecognition?: ConstrutorReconhecedor
    webkitSpeechRecognition?: ConstrutorReconhecedor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const falaSuportada = (): boolean => construtor() !== null

export interface OpcoesEscuta {
  continuo: boolean
  aoParcial: (texto: string) => void
  aoFinal: (texto: string) => void
  aoErro?: (mensagem: string) => void
  aoTerminar?: () => void
}

const MENSAGENS_ERRO: Record<string, string> = {
  'not-allowed': 'Permita o uso do microfone para o Sinalume.',
  'no-speech': 'Não ouvi nada. Tente falar mais perto do celular.',
  network: 'Sem internet: a transcrição de fala precisa de conexão. Você pode digitar.',
  'audio-capture': 'Nenhum microfone encontrado.',
}

/** Inicia a escuta. Retorna uma função para parar. */
export function escutar(op: OpcoesEscuta): () => void {
  const C = construtor()
  if (!C) {
    op.aoErro?.('Este navegador não transcreve fala. Use o Chrome no Android ou digite o texto.')
    return () => {}
  }
  let ativo = true
  const rec = new C()
  rec.lang = 'pt-BR'
  rec.continuous = op.continuo
  rec.interimResults = true

  rec.onresult = (e) => {
    let parcial = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      const t = r[0].transcript.trim()
      if (r.isFinal) {
        if (t) op.aoFinal(t)
      } else {
        parcial += t + ' '
      }
    }
    op.aoParcial(parcial.trim())
  }
  rec.onerror = (e) => {
    if (e.error === 'aborted') return
    if (e.error === 'no-speech' && op.continuo) return // no culto, silêncio é normal
    op.aoErro?.(MENSAGENS_ERRO[e.error] ?? `Erro no microfone: ${e.error}`)
  }
  rec.onend = () => {
    // o Chrome encerra a escuta contínua sozinho de tempos em tempos; no modo culto, religamos
    if (ativo && op.continuo) {
      try {
        rec.start()
        return
      } catch {
        /* segue para terminar */
      }
    }
    op.aoTerminar?.()
  }
  rec.start()
  return () => {
    ativo = false
    rec.stop()
  }
}

let vozPtBr: SpeechSynthesisVoice | null = null
function escolherVoz() {
  const vozes = speechSynthesis.getVoices()
  vozPtBr = vozes.find((v) => v.lang === 'pt-BR') ?? vozes.find((v) => v.lang.startsWith('pt')) ?? null
}
if (typeof speechSynthesis !== 'undefined') {
  escolherVoz()
  speechSynthesis.onvoiceschanged = escolherVoz
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
