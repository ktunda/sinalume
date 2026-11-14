// Lógica da função de contribuição (testável sem Vercel e sem GitHub de verdade).
import { criarPacote, LIMITES, lerPacote, type ExemploLido } from '../../src/lib/pacote'

export interface Config {
  token: string
  repo: string // "usuario/sinalume"
  base?: string // branch principal
  maxPedidosAbertos?: number
}

export type Resposta = { status: number; corpo: Record<string, unknown> }

type Fetch = typeof fetch

function paraBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

function resumoGlosas(exemplos: ExemploLido[]): string {
  const conta = new Map<string, number>()
  exemplos.forEach((e) => conta.set(e.glosa, (conta.get(e.glosa) ?? 0) + 1))
  return [...conta.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g, n]) => `${g} ×${n}`)
    .join(', ')
}

export async function processarContribuicao(textoCorpo: string, cfg: Config, f: Fetch = fetch): Promise<Resposta> {
  if (textoCorpo.length > LIMITES.bytesEnvio) return { status: 413, corpo: { erro: 'Envio grande demais.' } }
  let corpo: { consentimento?: unknown; pacote?: unknown }
  try {
    corpo = JSON.parse(textoCorpo)
  } catch {
    return { status: 400, corpo: { erro: 'JSON inválido.' } }
  }
  if (corpo.consentimento !== true) return { status: 400, corpo: { erro: 'Falta o consentimento.' } }
  const lido = lerPacote(corpo.pacote, { maxExemplos: LIMITES.exemplosPorEnvio })
  if (!lido.ok) return { status: 422, corpo: { erro: 'Pacote inválido.', detalhes: lido.erros.slice(0, 10) } }
  if (lido.exemplos.length === 0) return { status: 422, corpo: { erro: 'Nenhum exemplo.' } }

  const base = cfg.base ?? 'main'
  const api = `https://api.github.com/repos/${cfg.repo}`
  const h = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'sinalume-contribuicoes',
  }
  const gh = async (caminho: string, init?: RequestInit) => {
    const r = await f(`${api}${caminho}`, { ...init, headers: { ...h, ...(init?.headers ?? {}) } })
    if (!r.ok) throw new Error(`GitHub ${init?.method ?? 'GET'} ${caminho}: ${r.status} ${await r.text()}`)
    return r.json()
  }

  try {
    // proteção contra enxurrada: limita a fila de pedidos aguardando revisão
    const abertos = (await gh(`/pulls?state=open&per_page=100&base=${base}`)) as { head: { ref: string } }[]
    const fila = abertos.filter((p) => p.head.ref.startsWith('contribuicao/')).length
    if (fila >= (cfg.maxPedidosAbertos ?? 60)) {
      return { status: 503, corpo: { erro: 'Muitas contribuições aguardando revisão. Tente de novo em alguns dias.' } }
    }

    const agora = new Date()
    const id = `${agora.toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`
    const ramo = `contribuicao/${id}`
    const caminho = `acervo/contribuicoes/${agora.toISOString().slice(0, 7)}/${id}.json`
    // guardamos um pacote reconstruído a partir dos dados validados — nunca o texto bruto recebido
    const pacote = criarPacote(lido.exemplos, { origem: 'Sinalume — voluntários', licenca: 'CC-BY-4.0' })
    const conteudo = JSON.stringify({ ...pacote, recebidoEm: agora.toISOString() })

    const ref = (await gh(`/git/ref/heads/${base}`)) as { object: { sha: string } }
    await gh('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${ramo}`, sha: ref.object.sha }) })
    const glosas = resumoGlosas(lido.exemplos)
    await gh(`/contents/${caminho}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Contribuição de sinais: ${lido.exemplos.length} gravações`,
        content: paraBase64(conteudo),
        branch: ramo,
      }),
    })
    const autores = [...new Set(lido.exemplos.map((e) => [e.autor, e.uf].filter(Boolean).join(' · ')).filter(Boolean))]
    const titulo = `Contribuição: ${lido.exemplos.length} gravações · ${glosas.split(', ').slice(0, 3).join(', ')}`
    const pr = (await gh('/pulls', {
      method: 'POST',
      body: JSON.stringify({
        title: titulo.slice(0, 120),
        head: ramo,
        base,
        body: [
          `**Sinais:** ${glosas}`,
          `**Voluntário(a):** ${autores.join('; ') || 'anônimo'}`,
          '',
          'Enviado pelo app com consentimento (pontos das mãos, sem vídeo; licença CC BY 4.0).',
          'A verificação automática comenta abaixo se algum sinal parece errado. Se estiver tudo certo, clique em **Merge**.',
        ].join('\n'),
      }),
    })) as { number: number; html_url: string }
    await gh(`/issues/${pr.number}/labels`, { method: 'POST', body: JSON.stringify({ labels: ['contribuição'] }) }).catch(
      () => {},
    )
    return { status: 201, corpo: { ok: true, pedido: pr.html_url, exemplos: lido.exemplos.length } }
  } catch (e) {
    console.error(e)
    return { status: 502, corpo: { erro: 'Não foi possível registrar a contribuição agora. Tente mais tarde.' } }
  }
}
