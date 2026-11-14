// Acervo de exemplos de sinais, guardado só no celular (IndexedDB).
// Pode ser exportado/importado como arquivo .json para compartilhar entre membros de uma igreja ou associação.
import { get, set } from 'idb-keyval'
import { DIM, QUADROS_NORMALIZADOS, reamostrar, type Exemplo } from './reconhecedor'

const CHAVE = 'sinalume:exemplos:v1'

export async function carregarExemplos(): Promise<Exemplo[]> {
  return (await get<Exemplo[]>(CHAVE)) ?? []
}

async function salvar(lista: Exemplo[]) {
  await set(CHAVE, lista)
}

const arredondar = (q: number[][]) => q.map((l) => l.map((v) => Math.round(v * 1000) / 1000))

export async function adicionarExemplo(glosa: string, sequencia: number[][]): Promise<Exemplo> {
  const ex: Exemplo = {
    id: crypto.randomUUID(),
    glosa,
    quadros: arredondar(reamostrar(sequencia)),
    origem: 'gravado',
    criadoEm: Date.now(),
  }
  const lista = await carregarExemplos()
  lista.push(ex)
  await salvar(lista)
  return ex
}

export async function removerGlosa(glosa: string): Promise<void> {
  await salvar((await carregarExemplos()).filter((e) => e.glosa !== glosa))
}

export async function removerExemplo(id: string): Promise<void> {
  await salvar((await carregarExemplos()).filter((e) => e.id !== id))
}

export interface PacoteSinais {
  formato: 'sinalume-exemplos'
  versao: 1
  dim: number
  quadros: number
  origem?: string
  exemplos: { glosa: string; quadros: number[][] }[]
}

export async function exportarPacote(): Promise<Blob> {
  const lista = await carregarExemplos()
  const pacote: PacoteSinais = {
    formato: 'sinalume-exemplos',
    versao: 1,
    dim: DIM,
    quadros: QUADROS_NORMALIZADOS,
    exemplos: lista.map((e) => ({ glosa: e.glosa, quadros: e.quadros })),
  }
  return new Blob([JSON.stringify(pacote)], { type: 'application/json' })
}

/** Importa um pacote (gerado pelo app ou pelo script training/gerar_pacote.py). Retorna quantos entraram. */
export async function importarPacote(texto: string): Promise<number> {
  const p = JSON.parse(texto) as PacoteSinais
  if (p.formato !== 'sinalume-exemplos' || p.dim !== DIM) {
    throw new Error('Arquivo não é um pacote de sinais do Sinalume compatível.')
  }
  const lista = await carregarExemplos()
  const novos: Exemplo[] = p.exemplos
    .filter((e) => Array.isArray(e.quadros) && e.quadros.length > 0 && e.quadros[0].length === DIM)
    .map((e) => ({
      id: crypto.randomUUID(),
      glosa: e.glosa.toUpperCase(),
      quadros: e.quadros.length === QUADROS_NORMALIZADOS ? e.quadros : reamostrar(e.quadros),
      origem: 'importado' as const,
      criadoEm: Date.now(),
    }))
  await salvar(lista.concat(novos))
  return novos.length
}
