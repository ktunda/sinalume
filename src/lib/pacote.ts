// Formato dos pacotes de sinais trocados entre celulares, enviados à comunidade e publicados no acervo.
// Código puro (sem navegador): usado pelo app, pela função de envio (api/) e pelos scripts do GitHub.
import { codificar, decodificar, DIM_CODEC, ESCALA, QUADROS } from './codec.js'

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const
export type UF = (typeof UFS)[number]

export interface ExemploPacote {
  glosa: string
  /** int8 base64 (versão 2) */
  q: string
  /** quem gravou (apelido opcional) e de onde — ajuda a manter variedade de pessoas e regiões */
  autor?: string
  uf?: UF
}

export interface PacoteV2 {
  formato: 'sinalume-exemplos'
  versao: 2
  dim: number
  quadros: number
  codificacao: 'int8-b64'
  escala: number
  origem?: string
  licenca?: string
  exemplos: ExemploPacote[]
}

/** Versão 1 (arrays de números), gerada pela 0.1.0 e pelo script Python. */
export interface PacoteV1 {
  formato: 'sinalume-exemplos'
  versao: 1
  dim: number
  quadros: number
  origem?: string
  exemplos: { glosa: string; quadros: number[][] }[]
}

export const LIMITES = {
  bytesEnvio: 1_500_000,
  exemplosPorEnvio: 250,
  tamanhoGlosa: 40,
  tamanhoAutor: 40,
}

const RE_GLOSA = /^[A-ZÀ-ÖØ-Þ0-9]+(-[A-ZÀ-ÖØ-Þ0-9]+)*$/u

export function normalizarGlosa(g: string): string {
  return g.normalize('NFC').trim().toUpperCase().replace(/[\s_]+/g, '-')
}

/** Apelido vira texto simples: só letras, números, espaço e . - ' (sem links, marcações ou menções). */
export function limparAutor(a: string): string {
  return a
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} .'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LIMITES.tamanhoAutor)
}

export function glosaValida(g: string): boolean {
  return g.length > 0 && g.length <= LIMITES.tamanhoGlosa && RE_GLOSA.test(g)
}

export function criarPacote(
  exemplos: { glosa: string; quadros: number[][]; autor?: string; uf?: UF }[],
  extra: { origem?: string; licenca?: string } = {},
): PacoteV2 {
  return {
    formato: 'sinalume-exemplos',
    versao: 2,
    dim: DIM_CODEC,
    quadros: QUADROS,
    codificacao: 'int8-b64',
    escala: ESCALA,
    ...extra,
    exemplos: exemplos.map((e) => ({
      glosa: e.glosa,
      q: codificar(e.quadros),
      ...(e.autor ? { autor: e.autor } : {}),
      ...(e.uf ? { uf: e.uf } : {}),
    })),
  }
}

export interface ExemploLido {
  glosa: string
  quadros: number[][]
  autor?: string
  uf?: UF
}

export type Validacao = { ok: true; exemplos: ExemploLido[] } | { ok: false; erros: string[] }

/**
 * Lê e valida um pacote (v1 ou v2). Nunca confia no conteúdo: confere formato, tamanhos, glosas e números.
 * Usado no app (importar), na função de envio e na verificação automática das contribuições.
 */
export function lerPacote(dado: unknown, opcoes: { maxExemplos?: number } = {}): Validacao {
  const erros: string[] = []
  const p = dado as { formato?: unknown; versao?: unknown; dim?: unknown; exemplos?: unknown } | null
  if (!p || typeof p !== 'object' || p.formato !== 'sinalume-exemplos') {
    return { ok: false, erros: ['Arquivo não é um pacote de sinais do Sinalume.'] }
  }
  if (p.dim !== DIM_CODEC) return { ok: false, erros: [`Pacote com dim ${p.dim}; esperado ${DIM_CODEC}.`] }
  if (!Array.isArray(p.exemplos)) return { ok: false, erros: ['Pacote sem lista de exemplos.'] }
  const max = opcoes.maxExemplos ?? Number.POSITIVE_INFINITY
  if (p.exemplos.length > max) return { ok: false, erros: [`Pacote com ${p.exemplos.length} exemplos; máximo ${max}.`] }

  const exemplos: ExemploLido[] = []
  ;(p.exemplos as Record<string, unknown>[]).forEach((e, i) => {
    const onde = `exemplo ${i + 1}`
    const glosa = typeof e.glosa === 'string' ? normalizarGlosa(e.glosa) : ''
    if (!glosaValida(glosa)) {
      erros.push(`${onde}: glosa inválida "${String(e.glosa).slice(0, 50)}"`)
      return
    }
    let quadros: number[][]
    try {
      if (p.versao === 2) {
        if (typeof e.q !== 'string') throw new Error('campo q ausente')
        quadros = decodificar(e.q)
      } else {
        quadros = e.quadros as number[][]
        if (!Array.isArray(quadros) || quadros.length === 0) throw new Error('sem quadros')
      }
    } catch (err) {
      erros.push(`${onde} (${glosa}): ${(err as Error).message}`)
      return
    }
    if (!quadros.every((l) => Array.isArray(l) && l.length === DIM_CODEC && l.every((v) => Number.isFinite(v)))) {
      erros.push(`${onde} (${glosa}): valores inválidos`)
      return
    }
    // um sinal sem nenhuma mão em nenhum quadro é lixo (presença fica nos índices 65 e 131)
    if (!quadros.some((l) => l[65] > 0 || l[131] > 0)) {
      erros.push(`${onde} (${glosa}): nenhuma mão detectada`)
      return
    }
    const autor = typeof e.autor === 'string' ? limparAutor(e.autor) : undefined
    const uf = typeof e.uf === 'string' && (UFS as readonly string[]).includes(e.uf) ? (e.uf as UF) : undefined
    exemplos.push({ glosa, quadros, ...(autor ? { autor } : {}), ...(uf ? { uf } : {}) })
  })
  return erros.length ? { ok: false, erros } : { ok: true, exemplos }
}
