// Função gratuita (Vercel, plano Hobby — uso não comercial) que recebe as gravações dos voluntários
// e guarda no Vercel Blob. Não precisa de nenhum token configurado à mão: ao conectar um Blob store
// ao projeto, o Vercel injeta BLOB_READ_WRITE_TOKEN sozinho.
import { put } from '@vercel/blob'
import { processarContribuicao } from './_lib/contribuicao'
import { ACESSO_BLOB, cors, json } from './_lib/http'

const tentativas = new Map<string, number[]>()
const LIMITE_POR_HORA = 6

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get('origin'), 'POST, OPTIONS') })
}

export async function POST(req: Request) {
  const c = cors(req.headers.get('origin'), 'POST, OPTIONS')
  // limite simples por IP (melhor esforço; a revisão humana é a proteção principal). O IP não é guardado.
  const ip = (req.headers.get('x-forwarded-for') ?? 'desconhecido').split(',')[0].trim()
  const agora = Date.now()
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < 3_600_000)
  if (recentes.length >= LIMITE_POR_HORA) return json(429, { erro: 'Muitos envios seguidos. Tente daqui a uma hora.' }, c)
  tentativas.set(ip, [...recentes, agora])

  const r = await processarContribuicao(await req.text(), async (caminho, conteudo) => {
    await put(caminho, conteudo, { access: ACESSO_BLOB, contentType: 'application/json', addRandomSuffix: false })
  })
  return json(r.status, r.corpo, c)
}
