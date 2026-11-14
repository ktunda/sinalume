// Utilitários HTTP das funções (CORS e JSON).
export const ACESSO_BLOB: 'public' | 'private' = process.env.BLOB_ACESSO === 'public' ? 'public' : 'private'

export function cors(origem: string | null, metodos = 'GET, POST, OPTIONS'): Record<string, string> {
  const permitidas = (process.env.ORIGENS_PERMITIDAS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const ok = permitidas.length === 0 || (origem !== null && permitidas.includes(origem))
  return {
    'Access-Control-Allow-Origin': ok ? (origem ?? '*') : permitidas[0],
    'Access-Control-Allow-Methods': metodos,
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export function json(status: number, corpo: unknown, cabecalhos: Record<string, string> = {}) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cabecalhos },
  })
}
