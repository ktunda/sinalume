// Avatar VLibras (Governo Federal + UFPB, LGPL-3.0).
// - Os arquivos do avatar (Unity WebGL) são servidos pelo próprio Sinalume (public/assets/vlibras) e ficam em cache.
// - O texto vira glosa no tradutor oficial do VLibras; os sinais são baixados do dicionário oficial.
// Controle direto do Unity (objeto "PlayerManager"), conferido nos nomes de método do próprio build do avatar:
// playNow, setBaseUrl, setSlider, stopAll, setPauseState, playWellcome, setSubtitlesState.
//
// Uma única instância é criada e reaproveitada entre as telas (o avatar pesa ~14 MB).

export type Velocidade = 0.5 | 1.0 | 1.5 | 2.0
export type EstadoAvatar = 'parado' | 'carregando' | 'pronto' | 'erro'

const TRADUTOR = 'https://traducao2.vlibras.gov.br/translate'
const DICIONARIO = 'https://dicionario2.vlibras.gov.br/2018.3.1/WEBGL/'
const PASTA = './assets/vlibras/'
const ID_CONTAINER = 'vlibras-game-container'

interface UnityInstance {
  SendMessage(objeto: string, metodo: string, valor?: string | number): void
}
interface UnityLoaderGlobal {
  instantiate(
    container: string,
    config: string,
    opcoes: { compatibilityCheck?: (inst: unknown, aceitar: () => void, negar: () => void) => void },
  ): UnityInstance
  SystemInfo: { hasWebGL: boolean }
}

let unity: UnityInstance | null = null
let hospedeiro: HTMLDivElement | null = null
let estado: EstadoAvatar = 'parado'
let ultimaGlosa = ''
let velocidade: Velocidade = 1.0
const fila: string[] = []
// glosas prontas esperando o avatar terminar o sinal atual (no culto a fala não para)
const filaGlosas: string[] = []
let tocando = false
let ultimoPlay = 0
const MAX_ESPERA = 2
const ouvintesFalha = new Set<(msg: string) => void>()

/** Avisa a tela quando o texto não pôde virar Libras (ex.: sem internet). */
export function aoFalharTraducao(f: (msg: string) => void): () => void {
  ouvintesFalha.add(f)
  return () => {
    ouvintesFalha.delete(f)
  }
}

// ---- proteção para celulares fracos -------------------------------------------------------
// O avatar (Unity, ~256 MB de memória) pode derrubar a aba em celulares com pouca memória:
// o navegador mostra uma página de erro. Marcamos quando o avatar está trabalhando; se o app
// reabrir com a marca ainda lá, a última sessão travou e o avatar fica desligado até a pessoa pedir.
const CHAVE_TRABALHO = 'sinalume:avatar:trabalhando'
const CHAVE_DESLIGADO = 'sinalume:avatar:desligado'

function marcarTrabalho(ligado: boolean) {
  try {
    if (ligado) localStorage.setItem(CHAVE_TRABALHO, String(Date.now()))
    else localStorage.removeItem(CHAVE_TRABALHO)
  } catch {
    /* sem localStorage */
  }
}

export type MotivoDesligado = 'travou' | 'pouca-memoria' | 'escolha' | null

/** Por que o avatar deve começar desligado neste aparelho (null = pode carregar). */
export function motivoAvatarDesligado(): MotivoDesligado {
  try {
    const escolha = localStorage.getItem(CHAVE_DESLIGADO)
    if (escolha === 'ligado') return null
    if (escolha === 'travou' || escolha === 'escolha') return escolha
    const marca = Number(localStorage.getItem(CHAVE_TRABALHO))
    if (marca && Date.now() - marca < 30 * 60_000) {
      localStorage.setItem(CHAVE_DESLIGADO, 'travou')
      localStorage.removeItem(CHAVE_TRABALHO)
      return 'travou'
    }
  } catch {
    /* sem localStorage */
  }
  const memoria = (navigator as unknown as { deviceMemory?: number }).deviceMemory
  if (memoria !== undefined && memoria <= 1) return 'pouca-memoria'
  return null
}

/** Guarda a escolha da pessoa: ligar o avatar mesmo assim, ou deixar desligado. */
export function escolherAvatar(ligado: boolean) {
  try {
    localStorage.setItem(CHAVE_DESLIGADO, ligado ? 'ligado' : 'escolha')
    localStorage.removeItem(CHAVE_TRABALHO)
  } catch {
    /* sem localStorage */
  }
}

if (typeof window !== 'undefined') {
  // saída normal (fechar, trocar de app): não é travamento
  window.addEventListener('pagehide', () => marcarTrabalho(false))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') marcarTrabalho(false)
  })
}

function tocar(glosa: string) {
  marcarTrabalho(true)
  ultimaGlosa = glosa
  tocando = true
  ultimoPlay = Date.now()
  enviar('playNow', glosa)
}

function proximaGlosa() {
  const g = filaGlosas.shift()
  if (g) tocar(g)
}
const ouvintesEstado = new Set<(s: EstadoAvatar) => void>()

function mudarEstado(s: EstadoAvatar) {
  estado = s
  ouvintesEstado.forEach((f) => f(s))
}

export function aoMudarEstado(f: (s: EstadoAvatar) => void): () => void {
  ouvintesEstado.add(f)
  f(estado)
  return () => {
    ouvintesEstado.delete(f)
  }
}

function enviar(metodo: string, valor?: string | number) {
  try {
    unity?.SendMessage('PlayerManager', metodo, valor)
  } catch (e) {
    console.warn('[vlibras]', metodo, e)
  }
}

function carregarScript(src: string): Promise<void> {
  return new Promise((ok, falha) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => ok()
    s.onerror = () => falha(new Error(`não carregou ${src}`))
    document.head.appendChild(s)
  })
}

async function criarPlayer() {
  marcarTrabalho(true)
  hospedeiro = document.createElement('div')
  hospedeiro.className = 'avatar__hospedeiro'
  const container = document.createElement('div')
  container.id = ID_CONTAINER
  hospedeiro.appendChild(container)
  mudarEstado('carregando')

  // Funções globais que o Unity do VLibras chama
  const w = window as unknown as Record<string, unknown>
  w.onLoadPlayer = () => {
    enviar('setBaseUrl', DICIONARIO)
    enviar('setSlider', velocidade)
    marcarTrabalho(false)
    mudarEstado('pronto')
    const pendente = fila.splice(0)
    if (pendente.length) void sinalizar(pendente.join('. '))
  }
  w.onPlayingStateChange = (...args: unknown[]) => {
    const v = String(args[0]).toLowerCase()
    const agora = v === 'true' || v === '1'
    if (tocando && !agora) {
      tocando = false
      if (filaGlosas.length === 0) marcarTrabalho(false)
      proximaGlosa()
    } else tocando = agora
  }
  for (const nome of ['GetAvatar', 'CounterGloss', 'FinishWelcome', 'updateProgress']) {
    if (typeof w[nome] !== 'function') w[nome] = () => {}
  }

  try {
    await carregarScript(`${PASTA}UnityLoader.js`)
    const loader = w.UnityLoader as UnityLoaderGlobal | undefined
    if (!loader) throw new Error('UnityLoader ausente')
    // o container precisa estar no documento para o Unity criar o canvas
    if (!hospedeiro.isConnected) estacionar(hospedeiro)
    unity = loader.instantiate(ID_CONTAINER, `${PASTA}playerweb.json`, {
      compatibilityCheck: (_inst, aceitar, negar) => {
        if (loader.SystemInfo.hasWebGL) aceitar()
        else {
          mudarEstado('erro')
          negar()
        }
      },
    })
  } catch (e) {
    console.error('[vlibras]', e)
    mudarEstado('erro')
  }
}

function estacionar(el: HTMLElement) {
  let estacionamento = document.getElementById('avatar-estacionado')
  if (!estacionamento) {
    estacionamento = document.createElement('div')
    estacionamento.id = 'avatar-estacionado'
    estacionamento.style.cssText = 'position:fixed;left:-10000px;top:0;width:300px;height:300px;overflow:hidden'
    document.body.appendChild(estacionamento)
  }
  estacionamento.appendChild(el)
}

/** Mostra o avatar dentro do elemento (cria na primeira vez, depois só move). */
export function montarAvatar(container: HTMLElement): void {
  if (!hospedeiro) void criarPlayer()
  if (hospedeiro && hospedeiro.parentElement !== container) container.appendChild(hospedeiro)
}

/** Tira o avatar da tela sem destruí-lo, para reaproveitar depois. */
export function desmontarAvatar(container: HTMLElement): void {
  if (hospedeiro && hospedeiro.parentElement === container) estacionar(hospedeiro)
}

/** Português -> glosa de Libras, pelo tradutor oficial do VLibras. */
export async function traduzirParaGlosa(texto: string): Promise<string> {
  const r = await fetch(TRADUTOR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto }),
  })
  if (!r.ok) throw new Error(`tradutor VLibras respondeu ${r.status}`)
  return (await r.text()).trim()
}

/** Faz o avatar sinalizar o texto. Frases longas são quebradas em partes curtas. */
export async function sinalizar(texto: string): Promise<void> {
  const partes = quebrarFrases(texto)
  if (!unity || estado !== 'pronto') {
    fila.push(...partes)
    // evita acumular: no culto só importam as frases mais recentes
    while (fila.length > 3) fila.shift()
    return
  }
  let glosa = ''
  try {
    glosa = (await Promise.all(partes.map(traduzirParaGlosa))).filter(Boolean).join(' ')
  } catch (e) {
    console.warn('[vlibras] tradução falhou', e)
    if (!navigator.onLine) {
      ouvintesFalha.forEach((f) => f('Sem internet: o avatar precisa de conexão. A legenda continua funcionando.'))
      return
    }
    // o tradutor do governo não respondeu: o avatar sinaliza palavra por palavra (tradução simplificada)
    glosa = glosaSimples(texto)
    ouvintesFalha.forEach((f) => f('O tradutor do VLibras está fora do ar. O avatar está sinalizando palavra por palavra.'))
  }
  if (!glosa) return
  // se o avatar ainda está sinalizando, espera a vez (sem cortar o sinal no meio).
  // Proteção: se o aviso de "terminou" não chegar em 20 s, segue mesmo assim.
  if (tocando && Date.now() - ultimoPlay < 20_000) {
    filaGlosas.push(glosa)
    while (filaGlosas.length > MAX_ESPERA) filaGlosas.shift()
  } else tocar(glosa)
}

export function definirVelocidade(v: Velocidade): void {
  velocidade = v
  if (estado === 'pronto') enviar('setSlider', v)
}

export function repetir(): void {
  if (estado === 'pronto' && ultimaGlosa) {
    filaGlosas.length = 0
    tocar(ultimaGlosa)
  }
}

export function parar(): void {
  filaGlosas.length = 0
  tocando = false
  if (estado === 'pronto') enviar('stopAll')
}

/** Divide em frases de até ~12 palavras: o VLibras traduz melhor frases curtas. */
export function quebrarFrases(texto: string, maxPalavras = 12): string[] {
  const frases = texto
    .split(/(?<=[.!?;])\s+/)
    .map((f) => f.trim())
    .filter(Boolean)
  const saida: string[] = []
  for (const f of frases) {
    const palavras = f.split(/\s+/)
    for (let i = 0; i < palavras.length; i += maxPalavras) {
      saida.push(palavras.slice(i, i + maxPalavras).join(' '))
    }
  }
  return saida
}

/** Tradução simplificada quando o tradutor oficial falha: palavras em maiúsculas, sem pontuação. */
export function glosaSimples(texto: string): string {
  return texto
    .normalize('NFC')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
}
