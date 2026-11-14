// Autenticação da automação do GitHub sem nenhuma senha guardada à mão.
// O GitHub Actions emite, a cada execução, um token assinado (OIDC) que diz de qual repositório,
// ramo e evento ele veio. Aqui conferimos a assinatura com as chaves públicas do GitHub e
// aceitamos só tokens do repositório oficial, no ramo principal, fora de pull requests.
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

export const EMISSOR_GITHUB = 'https://token.actions.githubusercontent.com'
export const AUDIENCIA = 'sinalume-api'

let chavesGitHub: JWTVerifyGetKey | undefined
function chavesPadrao(): JWTVerifyGetKey {
  chavesGitHub ??= createRemoteJWKSet(new URL(`${EMISSOR_GITHUB}/.well-known/jwks`))
  return chavesGitHub
}

export interface Regras {
  repositorio: string
  ramo: string
}

export function regrasPadrao(): Regras {
  return {
    repositorio: process.env.REPOSITORIO_GITHUB || 'ktunda/sinalume',
    ramo: process.env.RAMO_GITHUB || 'refs/heads/main',
  }
}

/** Retorna null se o pedido veio da automação oficial; senão, o motivo da recusa. */
export async function conferirAutomacao(
  cabecalho: string | null,
  chaves: JWTVerifyGetKey = chavesPadrao(),
  regras: Regras = regrasPadrao(),
): Promise<string | null> {
  const token = cabecalho?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) return 'sem token'
  try {
    const { payload } = await jwtVerify(token, chaves, {
      issuer: EMISSOR_GITHUB,
      audience: AUDIENCIA,
      algorithms: ['RS256'],
      clockTolerance: 30,
    })
    if (payload.repository !== regras.repositorio) return 'repositório não autorizado'
    if (payload.ref !== regras.ramo) return 'ramo não autorizado'
    if (typeof payload.event_name === 'string' && payload.event_name.startsWith('pull_request')) return 'evento não autorizado'
    return null
  } catch {
    return 'token inválido'
  }
}
