// Lógica da função de contribuição (testável sem Vercel).
// Valida o envio e guarda um pacote limpo. Quem leva ao GitHub é a automação
// .github/workflows/importar-contribuicoes.yml, que busca os envios e abre um pedido de aprovação para cada um.
import { criarPacote, LIMITES, lerPacote } from '../../src/lib/pacote.js'
import { consentimentoValido, registroConsentimento } from '../../src/lib/termo.js'

export type Resposta = { status: number; corpo: Record<string, unknown> }
export type Salvar = (caminho: string, conteudo: string) => Promise<void>

/** Identificador do envio: data + sufixo aleatório (ex.: 2026-11-14-a1b2c3d4). */
export const RE_ID = /^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}$/

/** Chave secreta de remoção: só quem enviou recebe; guardamos apenas o resumo (SHA-256). */
export const RE_CHAVE = /^[0-9a-f]{32}$/

export async function resumoChave(chave: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chave))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function novaChave(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function caminhoDoEnvio(id: string): string {
  return `contribuicoes/${id.slice(0, 7)}/${id}.json`
}

export async function processarContribuicao(textoCorpo: string, salvar: Salvar, agora = new Date()): Promise<Resposta> {
  if (textoCorpo.length > LIMITES.bytesEnvio) return { status: 413, corpo: { erro: 'Envio grande demais.' } }
  let corpo: { consentimento?: unknown; pacote?: unknown }
  try {
    corpo = JSON.parse(textoCorpo)
  } catch {
    return { status: 400, corpo: { erro: 'JSON inválido.' } }
  }
  const consentimento = corpo.consentimento
  if (!consentimentoValido(consentimento)) {
    return { status: 400, corpo: { erro: 'Falta o consentimento (termo atual e confirmação de idade). Atualize o app.' } }
  }
  const lido = lerPacote(corpo.pacote, { maxExemplos: LIMITES.exemplosPorEnvio })
  if (!lido.ok) return { status: 422, corpo: { erro: 'Pacote inválido.', detalhes: lido.erros.slice(0, 10) } }
  if (lido.exemplos.length === 0) return { status: 422, corpo: { erro: 'Nenhum exemplo.' } }

  const id = `${agora.toISOString().slice(0, 10)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
  // guardamos um pacote reconstruído a partir dos dados validados — nunca o texto bruto recebido
  const pacote = criarPacote(lido.exemplos, { origem: 'Sinalume — voluntários', licenca: 'CC-BY-4.0' })
  const chave = novaChave()
  try {
    await salvar(
      caminhoDoEnvio(id),
      JSON.stringify({
        ...pacote,
        id,
        recebidoEm: agora.toISOString(),
        consentimento: registroConsentimento(consentimento, agora.toISOString()),
        remocaoHash: await resumoChave(chave),
      }),
    )
  } catch (e) {
    console.error(e)
    return { status: 502, corpo: { erro: 'Não foi possível guardar a contribuição agora. Tente mais tarde.' } }
  }
  return { status: 201, corpo: { ok: true, id, chave, exemplos: lido.exemplos.length } }
}
