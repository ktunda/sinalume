// Função gratuita (Vercel, plano Hobby — uso não comercial) que recebe as gravações dos voluntários
// e guarda no Vercel Blob. Não precisa de nenhum token configurado à mão: ao conectar um Blob store
// ao projeto, o Vercel injeta BLOB_READ_WRITE_TOKEN sozinho.
import { put } from '@vercel/blob'
import { processarContribuicao } from './_lib/contribuicao.js'
import { ACESSO_BLOB, cors, ipDoCliente, json, limitador } from './_lib/http.js'

const permitir = limitador(6)

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get('origin'), 'POST, OPTIONS') })
}

export async function POST(req: Request) {
  const c = cors(req.headers.get('origin'), 'POST, OPTIONS')
  if (!permitir(ipDoCliente(req))) return json(429, { erro: 'Muitos envios seguidos. Tente daqui a uma hora.' }, c)

  const r = await processarContribuicao(await req.text(), async (caminho, conteudo) => {
    await put(caminho, conteudo, { access: ACESSO_BLOB, contentType: 'application/json', addRandomSuffix: false, ttlDays: 60 })
  })
  return json(r.status, r.corpo, c)
}
