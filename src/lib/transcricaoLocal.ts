// Gravação de áudio + transcrição no aparelho (Whisper em um Web Worker).
// Usado quando o navegador não transcreve fala (alguns iPhones, Firefox), quando a fala do navegador falha
// ou sem internet. Mesmo comportamento no iPhone e no Android.

export type Qualidade = 'preciso' | 'leve'
export const TAMANHO_MB: Record<Qualidade, number> = { preciso: 249, leve: 77 }
const CHAVE_QUALIDADE = 'sinalume:qualidade-fala'

export function qualidadePreferida(): Qualidade {
  try {
    return localStorage.getItem(CHAVE_QUALIDADE) === 'leve' ? 'leve' : 'preciso'
  } catch {
    return 'preciso'
  }
}

export function definirQualidade(q: Qualidade) {
  try {
    localStorage.setItem(CHAVE_QUALIDADE, q)
  } catch {
    /* ignore */
  }
  // troca de modelo: o próximo uso baixa/carrega o novo
  pronto = false
  carregandoModelo = null
  arquivos.clear()
  avisarProgresso()
}

export interface ProgressoModelo {
  carregados: number
  total: number
  pronto: boolean
}

let worker: Worker | null = null
let pronto = false
let carregandoModelo: Promise<void> | null = null
let proximoId = 1
const pendentes = new Map<number, { ok: (t: string) => void; falha: (e: Error) => void }>()
const ouvintesProgresso = new Set<(p: ProgressoModelo) => void>()
const arquivos = new Map<string, { loaded: number; total: number }>()

function avisarProgresso() {
  let carregados = 0
  let total = 0
  arquivos.forEach((a) => {
    carregados += a.loaded
    total += a.total
  })
  ouvintesProgresso.forEach((f) => f({ carregados, total, pronto }))
}

export function aoProgressoModelo(f: (p: ProgressoModelo) => void): () => void {
  ouvintesProgresso.add(f)
  return () => {
    ouvintesProgresso.delete(f)
  }
}

export const modeloPronto = () => pronto

function obterWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data as { tipo: string; id?: number; texto?: string; mensagem?: string; file?: string; loaded?: number; total?: number }
    if (m.tipo === 'progresso' && m.file && m.total) {
      arquivos.set(m.file, { loaded: m.loaded ?? 0, total: m.total })
      avisarProgresso()
    } else if (m.tipo === 'pronto') {
      pronto = true
      avisarProgresso()
    } else if (m.tipo === 'texto' && m.id !== undefined) {
      pronto = true
      pendentes.get(m.id)?.ok(m.texto ?? '')
      pendentes.delete(m.id)
    } else if (m.tipo === 'erro') {
      const erro = new Error(m.mensagem ?? 'falha na transcrição')
      if (m.id !== undefined && m.id >= 0) {
        pendentes.get(m.id)?.falha(erro)
        pendentes.delete(m.id)
      } else {
        pendentes.forEach((p) => p.falha(erro))
        pendentes.clear()
      }
    }
  }
  return worker
}

/** Baixa (uma vez) e prepara o modelo de fala. */
export function prepararModelo(): Promise<void> {
  if (pronto) return Promise.resolve()
  if (carregandoModelo) return carregandoModelo
  carregandoModelo = new Promise<void>((ok, falha) => {
    const w = obterWorker()
    const f = (e: MessageEvent) => {
      if (e.data.tipo === 'pronto') {
        w.removeEventListener('message', f)
        ok()
      } else if (e.data.tipo === 'erro' && e.data.id === -1) {
        w.removeEventListener('message', f)
        carregandoModelo = null
        falha(new Error('Não consegui baixar o modelo de fala. Verifique a internet e tente de novo.'))
      }
    }
    w.addEventListener('message', f)
    w.postMessage({ tipo: 'carregar', qualidade: qualidadePreferida() })
  })
  return carregandoModelo
}

export function transcrever(audio16k: Float32Array): Promise<string> {
  const id = proximoId++
  return new Promise((ok, falha) => {
    pendentes.set(id, { ok, falha })
    obterWorker().postMessage({ tipo: 'transcrever', id, audio: audio16k, qualidade: qualidadePreferida() }, [audio16k.buffer])
  })
}

/** Converte o áudio gravado para 16 kHz mono, o formato que o Whisper espera. */
export async function paraPCM16k(blob: Blob): Promise<Float32Array> {
  const bytes = await blob.arrayBuffer()
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  const decodificado = await ctx.decodeAudioData(bytes)
  void ctx.close()
  const duracao = decodificado.duration
  const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(duracao * 16000)), 16000)
  const fonte = offline.createBufferSource()
  fonte.buffer = decodificado
  fonte.connect(offline.destination)
  fonte.start()
  const resultado = await offline.startRendering()
  return resultado.getChannelData(0).slice()
}

/** Volume médio (RMS): trechos quase em silêncio não são transcritos (o Whisper inventa frases no silêncio). */
export function volume(pcm: Float32Array): number {
  let s = 0
  for (let i = 0; i < pcm.length; i++) s += pcm[i] * pcm[i]
  return Math.sqrt(s / Math.max(1, pcm.length))
}

// Frases que o Whisper costuma "alucinar" em trechos sem fala
const ALUCINACOES = [/^obrigad[oa]\.?$/i, /^legendas? (pela|por)/i, /^tchau\.?$/i, /inscreva-se/i, /^\.+$/, /^…$/]
export function limparTranscricao(t: string): string {
  const texto = t.replace(/\s+/g, ' ').trim()
  return ALUCINACOES.some((r) => r.test(texto)) ? '' : texto
}

function tipoGravacao(): string | undefined {
  for (const t of ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t)) return t
  }
  return undefined
}

export interface Gravacao {
  /** termina e devolve o áudio gravado */
  parar(): Promise<Blob>
  /** descarta tudo e libera o microfone */
  cancelar(): void
}

export async function abrirMicrofone(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } })
}

export function gravar(stream: MediaStream): Gravacao {
  const mimeType = tipoGravacao()
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const partes: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && partes.push(e.data)
  rec.start()
  return {
    parar: () =>
      new Promise((ok) => {
        rec.onstop = () => ok(new Blob(partes, { type: rec.mimeType || mimeType || 'audio/webm' }))
        if (rec.state !== 'inactive') rec.stop()
        else ok(new Blob(partes))
      }),
    cancelar: () => {
      if (rec.state !== 'inactive') rec.stop()
    },
  }
}
