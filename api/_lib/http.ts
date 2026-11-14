// Utilitários HTTP das funções (CORS e JSON).
export const ACESSO_BLOB: 'public' | 'private' = process.env.BLOB_ACESSO === 'public' ? 'public' : 'private'

// Só o app oficial (e o computador de quem desenvolve) pode chamar as funções pelo navegador.
const ORIGENS_PADRAO = 'https://ktunda.github.io,http://localhost:5173,http://localhost:4173'

export function cors(origem: string | null, metodos = 'GET, POST, OPTIONS'): Record<string, string> {
  const permitidas = (process.env.ORIGENS_PERMITIDAS || ORIGENS_PADRAO).split(',').map((s) => s.trim()).filter(Boolean)
  const ok = origem !== null && permitidas.includes(origem)
  return {
    'Access-Control-Allow-Origin': ok ? origem : permitidas[0],
    'Access-Control-Allow-Methods': metodos,
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export function json(status: number, corpo: unknown, cabecalhos: Record<string, string> = {}) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...cabecalhos },
  })
}

/** IP de quem chamou, como o Vercel informa (não dá para falsificar pelo cabeçalho X-Forwarded-For). */
export function ipDoCliente(req: Request): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ??
    'desconhecido'
  )
}

/** Limite simples de pedidos por IP numa janela de tempo (por instância; a revisão humana é a proteção principal). */
export function limitador(maximo: number, janelaMs = 3_600_000) {
  const tentativas = new Map<string, number[]>()
  return (ip: string): boolean => {
    const agora = Date.now()
    if (tentativas.size > 5000) tentativas.clear()
    const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < janelaMs)
    if (recentes.length >= maximo) return false
    tentativas.set(ip, [...recentes, agora])
    return true
  }
}
