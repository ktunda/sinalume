/// <reference lib="webworker" />
// Transcrição de fala no próprio aparelho (Whisper, código aberto da OpenAI, rodando com Transformers.js).
// Funciona igual no iPhone e no Android, sem servidor e sem internet depois do primeiro download.
// A biblioteca vem do CDN gratuito jsDelivr e o modelo do Hugging Face; o navegador guarda os dois em cache.

const URL_TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2'
// "preciso" (whisper-small, ~249 MB) acerta bem português; "leve" (whisper-base, ~77 MB) erra mais
const MODELOS = { preciso: 'Xenova/whisper-small', leve: 'Xenova/whisper-base' } as const
type Qualidade = keyof typeof MODELOS

type Mensagem =
  | { tipo: 'carregar'; qualidade: Qualidade }
  | { tipo: 'transcrever'; id: number; audio: Float32Array; qualidade: Qualidade }

type Transcritor = (audio: Float32Array, opcoes: Record<string, unknown>) => Promise<{ text: string }>

let transcritor: Transcritor | null = null
let carregando: Promise<Transcritor> | null = null
let qualidadeAtual: Qualidade | null = null

async function carregar(qualidade: Qualidade): Promise<Transcritor> {
  if (qualidade !== qualidadeAtual) {
    transcritor = null
    carregando = null
    qualidadeAtual = qualidade
  }
  if (transcritor) return transcritor
  if (carregando) return carregando
  carregando = (async () => {
    const tf = (await import(/* @vite-ignore */ URL_TRANSFORMERS)) as {
      pipeline: (tarefa: string, modelo: string, opcoes: Record<string, unknown>) => Promise<Transcritor>
      env: { allowLocalModels: boolean }
    }
    tf.env.allowLocalModels = false
    const progresso = (p: { status?: string; file?: string; progress?: number; loaded?: number; total?: number }) =>
      self.postMessage({ tipo: 'progresso', ...p })
    const tentar = (device: 'webgpu' | 'wasm') =>
      tf.pipeline('automatic-speech-recognition', MODELOS[qualidade], { dtype: 'q8', device, progress_callback: progresso })
    try {
      transcritor = 'gpu' in navigator ? await tentar('webgpu') : await tentar('wasm')
    } catch {
      transcritor = await tentar('wasm')
    }
    return transcritor
  })()
  return carregando
}

self.onmessage = async (e: MessageEvent<Mensagem>) => {
  const m = e.data
  try {
    const t = await carregar(m.qualidade ?? 'preciso')
    if (m.tipo === 'carregar') {
      self.postMessage({ tipo: 'pronto' })
      return
    }
    const r = await t(m.audio, { language: 'portuguese', task: 'transcribe' })
    self.postMessage({ tipo: 'texto', id: m.id, texto: (r.text ?? '').trim() })
  } catch (err) {
    carregando = null
    self.postMessage({ tipo: 'erro', id: m.tipo === 'transcrever' ? m.id : -1, mensagem: String(err) })
  }
}
