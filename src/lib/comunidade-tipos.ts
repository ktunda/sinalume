// Tipos e funções puras do acervo da comunidade (usados pelo app e pelos scripts do GitHub).
import { VOCAB_POR_GLOSA, type Categoria } from './vocab'

export interface ArquivoAcervo {
  categoria: Categoria | 'outros'
  arquivo: string
  glosas: number
  exemplos: number
  bytes: number
}

/** Situação de um sinal no acervo da comunidade (contando todos os envios aprovados). */
export interface SituacaoSinal {
  glosa: string
  categoria: string
  exemplos: number
  pessoas: number
  ufs: string[]
}

export interface IndiceAcervo {
  formato: 'sinalume-acervo'
  versao: 1
  atualizadoEm: string
  totalGlosas: number
  totalExemplos: number
  arquivos: ArquivoAcervo[]
  sinais?: SituacaoSinal[]
}

/** Metas para um sinal ser considerado pronto: variedade de pessoas importa mais que quantidade. */
export const META = { pessoas: 3, exemplos: 10 }

export type Etapa = 'falta' | 'comecando' | 'pronto'

export function etapaDe(s: { exemplos: number; pessoas: number } | undefined): Etapa {
  if (!s || s.exemplos === 0) return 'falta'
  return s.pessoas >= META.pessoas && s.exemplos >= META.exemplos ? 'pronto' : 'comecando'
}

export function categoriaDe(glosa: string): Categoria | 'outros' {
  return VOCAB_POR_GLOSA.get(glosa)?.categoria ?? 'outros'
}
