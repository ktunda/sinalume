// Reconhecimento de sinais isolados por comparação com exemplos gravados (DTW + vizinhos mais próximos).
// Não precisa de servidor nem de treino pesado: funciona com poucos exemplos por sinal,
// gravados por voluntários ou importados de bancos públicos (V-LIBRASIL, MINDS-Libras).
// Quando houver um modelo neural treinado (training/), ele entra implementando a mesma interface Classificador.

import { DIM, vetorizar, type QuadroMaos } from './maos'

export const QUADROS_NORMALIZADOS = 32

export interface Exemplo {
  id: string
  glosa: string
  /** QUADROS_NORMALIZADOS x DIM, já reamostrado */
  quadros: number[][]
  origem: 'gravado' | 'importado' | 'comunidade'
  criadoEm: number
  /** quando foi enviado à comunidade (só para os gravados) */
  enviadoEm?: number
}

export interface Palpite {
  glosa: string
  confianca: number // 0..1
  alternativas: { glosa: string; distancia: number }[]
}

export interface Classificador {
  classificar(sequencia: number[][]): Palpite | null
}

/** Reamostra a sequência para um número fixo de quadros (interpolação linear). */
export function reamostrar(seq: number[][], n = QUADROS_NORMALIZADOS): number[][] {
  if (seq.length === 0) return []
  if (seq.length === 1) return Array.from({ length: n }, () => seq[0].slice())
  const saida: number[][] = []
  for (let i = 0; i < n; i++) {
    const pos = (i * (seq.length - 1)) / (n - 1)
    const a = Math.floor(pos)
    const b = Math.min(a + 1, seq.length - 1)
    const f = pos - a
    saida.push(seq[a].map((v, k) => v * (1 - f) + seq[b][k] * f))
  }
  return saida
}

function distQuadro(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    s += d * d
  }
  return Math.sqrt(s)
}

/** Dynamic Time Warping com faixa de Sakoe-Chiba: tolera sinais feitos mais rápido ou mais devagar. */
export function dtw(a: number[][], b: number[][], faixa = 6): number {
  const n = a.length
  const m = b.length
  const INF = Number.POSITIVE_INFINITY
  let anterior = new Array(m + 1).fill(INF)
  let atual = new Array(m + 1).fill(INF)
  anterior[0] = 0
  for (let i = 1; i <= n; i++) {
    atual.fill(INF)
    const j0 = Math.max(1, i - faixa)
    const j1 = Math.min(m, i + faixa)
    for (let j = j0; j <= j1; j++) {
      const custo = distQuadro(a[i - 1], b[j - 1])
      atual[j] = custo + Math.min(anterior[j], atual[j - 1], anterior[j - 1])
    }
    ;[anterior, atual] = [atual, anterior]
  }
  return anterior[m] / (n + m)
}

export class ClassificadorDTW implements Classificador {
  private exemplos: Exemplo[]
  limiarDistancia: number

  constructor(exemplos: Exemplo[], limiarDistancia = 1.6, comEspelho = true) {
    // cada gravação vale também espelhada: quem sinaliza com a outra mão (canhoto) é reconhecido
    // sem precisar gravar de novo
    this.exemplos = comEspelho ? exemplos.concat(exemplos.map((e) => ({ ...e, quadros: espelhar(e.quadros) }))) : exemplos
    this.limiarDistancia = limiarDistancia
  }

  get glosasConhecidas(): string[] {
    return [...new Set(this.exemplos.map((e) => e.glosa))]
  }

  classificar(sequencia: number[][]): Palpite | null {
    if (this.exemplos.length === 0 || sequencia.length < 4) return null
    const seq = reamostrar(sequencia)
    // melhor distância por glosa
    const melhorPorGlosa = new Map<string, number>()
    for (const ex of this.exemplos) {
      const d = dtw(seq, ex.quadros)
      const atual = melhorPorGlosa.get(ex.glosa)
      if (atual === undefined || d < atual) melhorPorGlosa.set(ex.glosa, d)
    }
    const ordenado = [...melhorPorGlosa.entries()].sort((x, y) => x[1] - y[1])
    const [glosa, d1] = ordenado[0]
    const d2 = ordenado[1]?.[1] ?? d1 * 2
    // confiança: quão perto do exemplo e quão melhor que o segundo colocado
    const proximidade = Math.max(0, 1 - d1 / this.limiarDistancia)
    const margem = Math.min(1, (d2 - d1) / (d2 || 1) * 2)
    const confianca = Math.max(0, Math.min(1, 0.6 * proximidade + 0.4 * margem))
    return {
      glosa,
      confianca,
      alternativas: ordenado.slice(0, 3).map(([g, d]) => ({ glosa: g, distancia: d })),
    }
  }
}

/**
 * Corta o fluxo contínuo de quadros em sinais.
 * Um sinal termina quando as mãos saem do quadro ou ficam paradas por um tempo.
 */
export class Segmentador {
  private buffer: number[][] = []
  private ultimoComMao = 0
  private paradoDesde = 0
  private anterior: number[] | null = null
  private emMovimento = false

  private aoTerminarSinal: (sequencia: number[][]) => void
  private opcoes: { semMaoMs: number; paradoMs: number; minQuadros: number; limiarMovimento: number }

  constructor(
    aoTerminarSinal: (sequencia: number[][]) => void,
    opcoes = { semMaoMs: 350, paradoMs: 700, minQuadros: 8, limiarMovimento: 0.02 },
  ) {
    this.aoTerminarSinal = aoTerminarSinal
    this.opcoes = opcoes
  }

  /** Cancela o sinal em andamento. */
  reiniciar() {
    this.buffer = []
    this.anterior = null
    this.emMovimento = false
  }

  /** Retorna true enquanto um sinal estiver sendo capturado. */
  get capturando(): boolean {
    return this.buffer.length > 0
  }

  alimentar(q: QuadroMaos) {
    const temMao = q.direita !== null || q.esquerda !== null
    if (temMao) {
      const v = vetorizar(q)
      this.ultimoComMao = q.t
      // movimento = deslocamento médio da posição das mãos (posições ficam nos índices 63,64 e 129,130)
      if (this.anterior) {
        const mov =
          Math.abs(v[63] - this.anterior[63]) + Math.abs(v[64] - this.anterior[64]) +
          Math.abs(v[129] - this.anterior[129]) + Math.abs(v[130] - this.anterior[130])
        if (mov > this.opcoes.limiarMovimento) {
          this.emMovimento = true
          this.paradoDesde = q.t
        }
      } else {
        this.paradoDesde = q.t
      }
      this.anterior = v
      this.buffer.push(v)
      // mão parada depois de ter se movido: fim do sinal
      if (this.emMovimento && q.t - this.paradoDesde > this.opcoes.paradoMs) this.fechar()
      // trava de segurança: sinais isolados raramente passam de 4 s
      if (this.buffer.length > 120) this.fechar()
    } else if (this.buffer.length > 0 && q.t - this.ultimoComMao > this.opcoes.semMaoMs) {
      this.fechar()
    }
  }

  private fechar() {
    const seq = this.buffer
    this.reiniciar()
    if (seq.length >= this.opcoes.minQuadros) this.aoTerminarSinal(seq)
  }
}

export { DIM }

const POR_MAO = 21 * 3 + 3

/** Espelha um sinal: troca mão direita e esquerda e inverte o eixo horizontal. */
export function espelhar(quadros: number[][]): number[][] {
  return quadros.map((q) => {
    if (q.length !== 2 * POR_MAO) return q
    const virar = (bloco: number[]) =>
      bloco.map((v, i) => (i < 21 * 3 ? (i % 3 === 0 ? -v : v) : i === 21 * 3 ? -v : v))
    return [...virar(q.slice(POR_MAO)), ...virar(q.slice(0, POR_MAO))]
  })
}
