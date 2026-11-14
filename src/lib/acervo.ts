// Acervo de exemplos de sinais guardado no celular (IndexedDB).
// - "gravado": feito neste celular (pode ser enviado à comunidade)
// - "importado": vindo de um arquivo compartilhado
// - "comunidade": baixado do acervo público do Sinalume (substituído a cada atualização)
import { get, set } from 'idb-keyval'
import { criarPacote, lerPacote, type UF } from './pacote'
import { QUADROS_NORMALIZADOS, reamostrar, type Exemplo } from './reconhecedor'

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

/** Apaga as gravações de uma glosa feitas ou importadas aqui (as da comunidade voltam na próxima atualização). */
export async function removerGlosa(glosa: string): Promise<void> {
  await salvar((await carregarExemplos()).filter((e) => e.glosa !== glosa || e.origem === 'comunidade'))
}

export async function removerExemplo(id: string): Promise<void> {
  await salvar((await carregarExemplos()).filter((e) => e.id !== id))
}

/** Exporta as gravações deste celular (não inclui o que veio da comunidade, que todos já têm). */
export async function exportarPacote(): Promise<Blob> {
  const lista = (await carregarExemplos()).filter((e) => e.origem !== 'comunidade')
  const pacote = criarPacote(lista, { origem: 'Sinalume — gravações de voluntários' })
  return new Blob([JSON.stringify(pacote)], { type: 'application/json' })
}

/** Importa um pacote (v1 ou v2, gerado pelo app ou pelo script training/gerar_pacote.py). */
export async function importarPacote(texto: string): Promise<number> {
  let dado: unknown
  try {
    dado = JSON.parse(texto)
  } catch {
    throw new Error('Arquivo não é um JSON válido.')
  }
  const r = lerPacote(dado)
  if (!r.ok) throw new Error(r.erros.slice(0, 3).join(' · '))
  const novos: Exemplo[] = r.exemplos.map((e) => ({
    id: crypto.randomUUID(),
    glosa: e.glosa,
    quadros: e.quadros.length === QUADROS_NORMALIZADOS ? e.quadros : reamostrar(e.quadros),
    origem: 'importado',
    criadoEm: Date.now(),
  }))
  await salvar((await carregarExemplos()).concat(novos))
  return novos.length
}

/** Gravações deste celular que ainda não foram enviadas à comunidade. */
export async function pendentesDeEnvio(): Promise<Exemplo[]> {
  return (await carregarExemplos()).filter((e) => e.origem === 'gravado' && !e.enviadoEm)
}

export async function marcarEnviados(ids: string[]): Promise<void> {
  const conjunto = new Set(ids)
  const agora = Date.now()
  await salvar((await carregarExemplos()).map((e) => (conjunto.has(e.id) ? { ...e, enviadoEm: agora } : e)))
}

/** Troca os exemplos da comunidade pelos recém-baixados, mantendo o que foi gravado ou importado aqui. */
export async function substituirComunidade(exemplos: { glosa: string; quadros: number[][] }[]): Promise<void> {
  const locais = (await carregarExemplos()).filter((e) => e.origem !== 'comunidade')
  const agora = Date.now()
  const daComunidade: Exemplo[] = exemplos.map((e) => ({
    id: crypto.randomUUID(),
    glosa: e.glosa,
    quadros: e.quadros,
    origem: 'comunidade',
    criadoEm: agora,
  }))
  await salvar(locais.concat(daComunidade))
}

export type { UF }
