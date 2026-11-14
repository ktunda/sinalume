// Pede ao GitHub Actions um token OIDC (assinado pelo GitHub) para a função /api/pendentes.
// Não há senha guardada: o token vale por poucos minutos e só para este repositório.
import { AUDIENCIA } from '../api/_lib/auth'

export async function cabecalhosAutomacao(): Promise<Record<string, string>> {
  const url = process.env.ACTIONS_ID_TOKEN_REQUEST_URL
  const pedido = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
  if (!url || !pedido) {
    console.error('Sem token OIDC: rode pelo GitHub Actions com "permissions: id-token: write".')
    process.exit(1)
  }
  const r = await fetch(`${url}&audience=${AUDIENCIA}`, { headers: { Authorization: `Bearer ${pedido}` } })
  if (!r.ok) {
    console.error(`Falha ao obter token OIDC: ${r.status}`)
    process.exit(1)
  }
  const { value } = (await r.json()) as { value: string }
  return { Authorization: `Bearer ${value}` }
}
