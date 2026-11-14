// Lista as contribuições recebidas (GET /api/pendentes) ou devolve uma delas (GET /api/pendentes?id=...).
// Usado pela automação do GitHub. Os dados são abertos (CC BY 4.0): só pontos das mãos, sem vídeo nem IP.
import { get, list } from '@vercel/blob'
import { caminhoDoEnvio, RE_ID } from './_lib/contribuicao'
import { ACESSO_BLOB, cors, json } from './_lib/http'

const DIAS = 45

export async function GET(req: Request) {
  const c = cors(req.headers.get('origin'), 'GET, OPTIONS')
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (id) {
    if (!RE_ID.test(id)) return json(400, { erro: 'id inválido' }, c)
    const r = await get(caminhoDoEnvio(id), { access: ACESSO_BLOB })
    if (!r || r.statusCode !== 200) return json(404, { erro: 'não encontrado' }, c)
    return new Response(r.stream, { headers: { 'Content-Type': 'application/json; charset=utf-8', ...c } })
  }

  const limite = Date.now() - DIAS * 86_400_000
  const itens: { id: string; recebidoEm: string; bytes: number }[] = []
  let cursor: string | undefined
  do {
    const pagina = await list({ prefix: 'contribuicoes/', cursor, limit: 1000 })
    for (const b of pagina.blobs) {
      const nome = b.pathname.split('/').pop()?.replace(/\.json$/, '') ?? ''
      if (RE_ID.test(nome) && b.uploadedAt.getTime() >= limite) {
        itens.push({ id: nome, recebidoEm: b.uploadedAt.toISOString(), bytes: b.size })
      }
    }
    cursor = pagina.hasMore ? pagina.cursor : undefined
  } while (cursor)
  itens.sort((a, b) => a.recebidoEm.localeCompare(b.recebidoEm))
  return json(200, { contribuicoes: itens }, { ...c, 'Cache-Control': 'no-store' })
}
