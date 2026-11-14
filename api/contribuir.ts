// Função gratuita (Vercel, plano Hobby — uso não comercial) que recebe gravações dos voluntários
// e abre um pedido de aprovação (Pull Request) no repositório do Sinalume.
// Variáveis de ambiente: GITHUB_TOKEN (token fine-grained só deste repositório: Contents e Pull requests
// leitura/escrita), GITHUB_REPO ("usuario/sinalume"), ORIGENS_PERMITIDAS (opcional, separadas por vírgula).
import { processarContribuicao } from './_lib/contribuicao'

const tentativas = new Map<string, number[]>()
const LIMITE_POR_HORA = 6

function cors(origem: string | null): Record<string, string> {
  const permitidas = (process.env.ORIGENS_PERMITIDAS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const ok = permitidas.length === 0 || (origem !== null && permitidas.includes(origem))
  return {
    'Access-Control-Allow-Origin': ok ? (origem ?? '*') : permitidas[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(status: number, corpo: unknown, cabecalhos: Record<string, string>) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cabecalhos },
  })
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get('origin')) })
}

export async function POST(req: Request) {
  const c = cors(req.headers.get('origin'))
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  if (!token || !repo) return json(500, { erro: 'Servidor sem configuração.' }, c)

  // limite simples por IP (melhor esforço; a revisão humana é a proteção principal). O IP não é guardado.
  const ip = (req.headers.get('x-forwarded-for') ?? 'desconhecido').split(',')[0].trim()
  const agora = Date.now()
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < 3_600_000)
  if (recentes.length >= LIMITE_POR_HORA) return json(429, { erro: 'Muitos envios seguidos. Tente daqui a uma hora.' }, c)
  tentativas.set(ip, [...recentes, agora])

  const r = await processarContribuicao(await req.text(), { token, repo })
  return json(r.status, r.corpo, c)
}
