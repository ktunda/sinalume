// Lista o que chegou pelo app para a automação do GitHub:
//   GET /api/pendentes                      contribuições de sinais
//   GET /api/pendentes?colecao=sugestoes    sugestões e pedidos de remoção
//   GET /api/pendentes?id=...               conteúdo de um item
// Os dados são abertos: pontos das mãos (CC BY 4.0) e textos que viram issues públicas. Sem IP nem contato.
import { get, list } from '@vercel/blob'
import { caminhoDoEnvio, RE_ID } from './_lib/contribuicao.js'
import { ACESSO_BLOB, cors, json } from './_lib/http.js'
import { caminhoDaSugestao, RE_ID_SUGESTAO } from './_lib/sugestao.js'

const DIAS = 45 // os arquivos se apagam sozinhos no Blob após 60 dias (ttlDays)

export async function GET(req: Request) {
  const c = cors(req.headers.get('origin'), 'GET, OPTIONS')
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (id) {
    const caminho = RE_ID.test(id) ? caminhoDoEnvio(id) : RE_ID_SUGESTAO.test(id) ? caminhoDaSugestao(id) : null
    if (!caminho) return json(400, { erro: 'id inválido' }, c)
    const r = await get(caminho, { access: ACESSO_BLOB })
    if (!r || r.statusCode !== 200) return json(404, { erro: 'não encontrado' }, c)
    return new Response(r.stream, { headers: { 'Content-Type': 'application/json; charset=utf-8', ...c } })
  }

  const sugestoes = url.searchParams.get('colecao') === 'sugestoes'
  const prefixo = sugestoes ? 'sugestoes/' : 'contribuicoes/'
  const valido = sugestoes ? RE_ID_SUGESTAO : RE_ID
  const limite = Date.now() - DIAS * 86_400_000
  const itens: { id: string; recebidoEm: string; bytes: number }[] = []
  let cursor: string | undefined
  do {
    const pagina = await list({ prefix: prefixo, cursor, limit: 1000 })
    for (const b of pagina.blobs) {
      const nome = b.pathname.split('/').pop()?.replace(/\.json$/, '') ?? ''
      if (valido.test(nome) && b.uploadedAt.getTime() >= limite) {
        itens.push({ id: nome, recebidoEm: b.uploadedAt.toISOString(), bytes: b.size })
      }
    }
    cursor = pagina.hasMore ? pagina.cursor : undefined
  } while (cursor)
  itens.sort((a, b) => a.recebidoEm.localeCompare(b.recebidoEm))
  return json(200, sugestoes ? { sugestoes: itens } : { contribuicoes: itens }, { ...c, 'Cache-Control': 'no-store' })
}
