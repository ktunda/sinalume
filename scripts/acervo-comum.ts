// Funções compartilhadas pelos scripts do acervo (rodam no GitHub Actions, com tsx).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { lerPacote, type ExemploLido } from '../src/lib/pacote'

export interface ExemploComFonte extends ExemploLido {
  /** identifica quem/de onde veio — usado para manter variedade de pessoas */
  fonte: string
  arquivo: string
}

export function listarJson(pasta: string): string[] {
  let saida: string[] = []
  let itens: string[]
  try {
    itens = readdirSync(pasta)
  } catch {
    return []
  }
  for (const nome of itens.sort()) {
    const caminho = join(pasta, nome)
    if (statSync(caminho).isDirectory()) saida = saida.concat(listarJson(caminho))
    else if (nome.endsWith('.json')) saida.push(caminho)
  }
  return saida
}

export function lerArquivo(caminho: string, raiz = '.'): { exemplos: ExemploComFonte[]; erros: string[] } {
  let dado: unknown
  try {
    dado = JSON.parse(readFileSync(caminho, 'utf8'))
  } catch (e) {
    return { exemplos: [], erros: [`JSON inválido: ${(e as Error).message}`] }
  }
  const r = lerPacote(dado)
  if (!r.ok) return { exemplos: [], erros: r.erros }
  const arquivo = relative(raiz, caminho)
  return {
    exemplos: r.exemplos.map((e) => ({
      ...e,
      arquivo,
      fonte: e.autor || e.uf ? `${e.autor ?? ''}|${e.uf ?? ''}` : arquivo,
    })),
    erros: [],
  }
}

export function lerAcervo(pastas: string[], ignorar: Set<string> = new Set()): ExemploComFonte[] {
  const todos: ExemploComFonte[] = []
  for (const pasta of pastas) {
    for (const arq of listarJson(pasta)) {
      if (ignorar.has(arq)) continue
      const { exemplos, erros } = lerArquivo(arq)
      if (erros.length) console.warn(`[acervo] ignorando ${arq}: ${erros[0]}`)
      todos.push(...exemplos)
    }
  }
  return todos
}

/**
 * Escolhe até `max` exemplos por glosa alternando entre fontes diferentes (pessoas/regiões),
 * para o reconhecimento funcionar com gente variada e o arquivo não crescer sem limite.
 * Os mais recentes de cada fonte têm preferência (lista já vem em ordem de arquivo/data).
 */
export function selecionarVariados(exemplos: ExemploComFonte[], max: number): ExemploComFonte[] {
  const porGlosa = new Map<string, Map<string, ExemploComFonte[]>>()
  for (const e of exemplos) {
    const fontes = porGlosa.get(e.glosa) ?? new Map<string, ExemploComFonte[]>()
    const lista = fontes.get(e.fonte) ?? []
    lista.unshift(e) // mais recente primeiro
    fontes.set(e.fonte, lista)
    porGlosa.set(e.glosa, fontes)
  }
  const saida: ExemploComFonte[] = []
  for (const fontes of porGlosa.values()) {
    const filas = [...fontes.values()]
    let escolhidos = 0
    for (let rodada = 0; escolhidos < max; rodada++) {
      let algum = false
      for (const fila of filas) {
        if (escolhidos >= max) break
        const e = fila.at(rodada)
        if (e) {
          saida.push(e)
          escolhidos++
          algum = true
        }
      }
      if (!algum) break
    }
  }
  return saida
}
