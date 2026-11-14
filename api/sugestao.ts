// Recebe sugestões de melhoria, avisos de erro e pedidos de remoção (sem conta, sem dados pessoais).
import { put } from '@vercel/blob'
import { ACESSO_BLOB, cors, json } from './_lib/http.js'
import { processarSugestao } from './_lib/sugestao.js'

const tentativas = new Map<string, number[]>()
const LIMITE_POR_HORA = 10

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get('origin'), 'POST, OPTIONS') })
}

export async function POST(req: Request) {
  const c = cors(req.headers.get('origin'), 'POST, OPTIONS')
  const ip = (req.headers.get('x-forwarded-for') ?? 'desconhecido').split(',')[0].trim()
  const agora = Date.now()
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < 3_600_000)
  if (recentes.length >= LIMITE_POR_HORA) return json(429, { erro: 'Muitas mensagens seguidas. Tente mais tarde.' }, c)
  tentativas.set(ip, [...recentes, agora])

  const r = await processarSugestao(await req.text(), async (caminho, conteudo) => {
    await put(caminho, conteudo, { access: ACESSO_BLOB, contentType: 'application/json', addRandomSuffix: false, ttlDays: 60 })
  })
  return json(r.status, r.corpo, c)
}
