// Avatar VLibras (governo federal, LGPL-3.0). Os arquivos do avatar são servidos pelo próprio Sinalume
// (public/assets/vlibras) e ficam em cache; só a tradução texto -> glosa usa o servidor do VLibras.
//
// Uma única instância do avatar é criada e reaproveitada entre as telas (o avatar pesa ~14 MB;
// recriar a cada tela gastaria memória e dados).
import { setupUnityBridge, VLibrasPlayer } from 'vlibras-player-webjs'

type PlayerConfig = NonNullable<ConstructorParameters<typeof VLibrasPlayer>[0]>

export type Velocidade = 0.5 | 1.0 | 1.5 | 2.0
export type Regiao = 'BR' | 'PE' | 'RJ' | 'SP'
export type EstadoAvatar = 'parado' | 'carregando' | 'pronto' | 'erro'

let player: VLibrasPlayer | null = null
let hospedeiro: HTMLDivElement | null = null
let estado: EstadoAvatar = 'parado'
let regiao: Regiao = 'BR'
const fila: string[] = []
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

function criarPlayer() {
  hospedeiro = document.createElement('div')
  hospedeiro.className = 'avatar__hospedeiro'

  // Funções globais que o Unity do VLibras chama (onLoadPlayer, GetAvatar, onPlayingStateChange…)
  const ponte = setupUnityBridge()
  ponte.setCallbacks({
    onLoadPlayer: () => {
      // o Unity terminou de carregar: agora sim o avatar aceita comandos
      player?.setRegion(regiao)
      mudarEstado('pronto')
      const pendente = fila.splice(0)
      if (pendente.length) player?.translate(pendente.join('. '))
    },
    onError: () => mudarEstado('erro'),
  })

  const config: PlayerConfig & { onReady: () => void } = {
    targetPath: './assets/vlibras',
    // sem onReady o player toca a animação de boas-vindas automaticamente
    onReady: () => {},
  }
  player = new VLibrasPlayer(config)
  mudarEstado('carregando')
  player.load(hospedeiro)
}

/** Mostra o avatar dentro do elemento (cria na primeira vez, depois só move). */
export function montarAvatar(container: HTMLElement): void {
  if (!player) criarPlayer()
  if (hospedeiro && hospedeiro.parentElement !== container) container.appendChild(hospedeiro)
}

/** Tira o avatar da tela sem destruí-lo, para reaproveitar depois. */
export function desmontarAvatar(container: HTMLElement): void {
  if (hospedeiro && hospedeiro.parentElement === container) {
    let estacionamento = document.getElementById('avatar-estacionado')
    if (!estacionamento) {
      estacionamento = document.createElement('div')
      estacionamento.id = 'avatar-estacionado'
      estacionamento.hidden = true
      document.body.appendChild(estacionamento)
    }
    estacionamento.appendChild(hospedeiro)
  }
}

/** Faz o avatar sinalizar o texto. Frases longas são quebradas em partes curtas. */
export function sinalizar(texto: string): void {
  const partes = quebrarFrases(texto)
  if (!player || estado !== 'pronto') {
    fila.push(...partes)
    // evita acumular: no culto só importam as frases mais recentes
    while (fila.length > 3) fila.shift()
    return
  }
  player.translate(partes.join('. '))
}

export function definirVelocidade(v: Velocidade): void {
  if (player && estado === 'pronto') player.setSpeed(v)
}

export function repetir(): void {
  if (player && estado === 'pronto') player.repeat()
}

export function definirRegiao(r: Regiao): void {
  regiao = r
  if (player && estado === 'pronto') player.setRegion(r)
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
