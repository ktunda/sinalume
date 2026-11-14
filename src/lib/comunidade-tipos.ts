// Tipos e funções puras do acervo da comunidade (usados pelo app e pelos scripts do GitHub).
import { VOCAB_POR_GLOSA, type Categoria } from './vocab'

export interface ArquivoAcervo {
  categoria: Categoria | 'outros'
  arquivo: string
  glosas: number
  exemplos: number
  bytes: number
}

export interface IndiceAcervo {
  formato: 'sinalume-acervo'
  versao: 1
  atualizadoEm: string
  totalGlosas: number
  totalExemplos: number
  arquivos: ArquivoAcervo[]
}

export function categoriaDe(glosa: string): Categoria | 'outros' {
  return VOCAB_POR_GLOSA.get(glosa)?.categoria ?? 'outros'
}
