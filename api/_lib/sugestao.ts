// Sugestões de melhoria, avisos de erro e pedidos de remoção enviados pelo app.
// Ficam guardados no Vercel Blob; a automação do GitHub transforma cada um em uma "issue" pública.
import type { Resposta, Salvar } from './contribuicao.js'

export const TIPOS_SUGESTAO = {
  melhoria: 'Ideia de melhoria',
  erro: 'Algo não funcionou',
  sinal: 'Sinal errado ou faltando',
  remocao: 'Remover minhas gravações',
  outro: 'Outro assunto',
} as const
export type TipoSugestao = keyof typeof TIPOS_SUGESTAO

export const RE_ID_SUGESTAO = /^\d{4}-\d{2}-\d{2}-s[0-9a-f]{8}$/
export const RE_CODIGO_ENVIO = /^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}$/

export function caminhoDaSugestao(id: string): string {
  return `sugestoes/${id.slice(0, 7)}/${id}.json`
}

export interface Sugestao {
  id: string
  tipo: TipoSugestao
  texto: string
  codigoEnvio?: string
  tela?: string
  recebidoEm: string
}

/** Limpa o texto: tira caracteres de controle e evita marcar pessoas (@) quando vira issue no GitHub. */
export function limparTexto(t: string, max = 2000): string {
  return t
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/@/g, '@​')
    .trim()
    .slice(0, max)
}

export async function processarSugestao(textoCorpo: string, salvar: Salvar, agora = new Date()): Promise<Resposta> {
  if (textoCorpo.length > 10_000) return { status: 413, corpo: { erro: 'Mensagem grande demais.' } }
  let c: { tipo?: unknown; texto?: unknown; codigoEnvio?: unknown; tela?: unknown }
  try {
    c = JSON.parse(textoCorpo)
  } catch {
    return { status: 400, corpo: { erro: 'JSON inválido.' } }
  }
  const tipo = String(c.tipo) as TipoSugestao
  if (!(tipo in TIPOS_SUGESTAO)) return { status: 422, corpo: { erro: 'Tipo de sugestão inválido.' } }
  const texto = typeof c.texto === 'string' ? limparTexto(c.texto) : ''
  const codigoEnvio = typeof c.codigoEnvio === 'string' ? c.codigoEnvio.trim() : ''
  if (tipo === 'remocao') {
    if (!RE_CODIGO_ENVIO.test(codigoEnvio)) {
      return { status: 422, corpo: { erro: 'Informe o código do envio (aparece em "Meus envios").' } }
    }
  } else if (texto.length < 5) {
    return { status: 422, corpo: { erro: 'Escreva um pouco mais sobre a sua sugestão.' } }
  }
  const id = `${agora.toISOString().slice(0, 10)}-s${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
  const sugestao: Sugestao = {
    id,
    tipo,
    texto,
    ...(codigoEnvio && RE_CODIGO_ENVIO.test(codigoEnvio) ? { codigoEnvio } : {}),
    ...(typeof c.tela === 'string' ? { tela: limparTexto(c.tela, 40) } : {}),
    recebidoEm: agora.toISOString(),
  }
  try {
    await salvar(caminhoDaSugestao(id), JSON.stringify(sugestao))
  } catch (e) {
    console.error(e)
    return { status: 502, corpo: { erro: 'Não foi possível enviar agora. Tente mais tarde.' } }
  }
  return { status: 201, corpo: { ok: true, id } }
}
