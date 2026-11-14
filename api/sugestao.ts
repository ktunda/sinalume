// Recebe sugestões de melhoria, avisos de erro e pedidos de remoção (sem conta, sem dados pessoais).
import { put } from '@vercel/blob'
import { ACESSO_BLOB, cors, ipDoCliente, json, limitador } from './_lib/http.js'
import { processarSugestao } from './_lib/sugestao.js'

const permitir = limitador(10)

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get('origin'), 'POST, OPTIONS') })
}

export async function POST(req: Request) {
  const c = cors(req.headers.get('origin'), 'POST, OPTIONS')
  if (!permitir(ipDoCliente(req))) return json(429, { erro: 'Muitas mensagens seguidas. Tente mais tarde.' }, c)

  const r = await processarSugestao(await req.text(), async (caminho, conteudo) => {
    await put(caminho, conteudo, { access: ACESSO_BLOB, contentType: 'application/json', addRandomSuffix: false, ttlDays: 60 })
  })
  return json(r.status, r.corpo, c)
}
