// Busca na função do Vercel as contribuições novas e prepara cada uma para virar um pedido de aprovação.
// Uso (no GitHub Actions): API_SINALUME=https://... tsx scripts/importar-contribuicoes.ts ja-feitos.txt
// Saída: imprime um id por linha e grava .importar/<id>.json e .importar/<id>.md (resumo para o pedido).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { caminhoDoEnvio, RE_ID } from '../api/_lib/contribuicao'
import { criarPacote, lerPacote } from '../src/lib/pacote'
import { consentimentoValido, registroConsentimento } from '../src/lib/termo'
import { cabecalhosAutomacao } from './token-github'

const API = (process.env.API_SINALUME ?? '').replace(/\/$/, '')
const MAX = Number(process.env.MAX_POR_EXECUCAO ?? 10)
if (!API) {
  console.error('Defina API_SINALUME (endereço do projeto no Vercel).')
  process.exit(1)
}

const jaFeitos = new Set(
  (process.argv[2] && existsSync(process.argv[2]) ? readFileSync(process.argv[2], 'utf8') : '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean),
)

const auth = await cabecalhosAutomacao()
const r = await fetch(`${API}/api/pendentes`, { headers: auth })
if (!r.ok) {
  console.error(`Falha ao listar contribuições: ${r.status}`)
  process.exit(1)
}
const { contribuicoes } = (await r.json()) as { contribuicoes: { id: string }[] }
mkdirSync('.importar', { recursive: true })

let feitos = 0
for (const { id } of contribuicoes) {
  if (feitos >= MAX) break
  if (!RE_ID.test(id) || jaFeitos.has(`contribuicao/${id}`)) continue
  if (existsSync(`acervo/${caminhoDoEnvio(id)}`)) continue

  const resp = await fetch(`${API}/api/pendentes?id=${id}`, { headers: auth })
  if (!resp.ok) {
    console.error(`[${id}] não baixou: ${resp.status}`)
    continue
  }
  const dado = (await resp.json()) as { recebidoEm?: string; consentimento?: unknown; remocaoHash?: unknown }
  const remocaoHash = typeof dado.remocaoHash === 'string' && /^[0-9a-f]{64}$/.test(dado.remocaoHash) ? dado.remocaoHash : undefined
  const c = dado.consentimento
  if (!consentimentoValido(c)) {
    console.error(`[${id}] sem consentimento válido, ignorado`)
    continue
  }
  const registro = registroConsentimento(c, dado.recebidoEm ?? '')
  const lido = lerPacote(dado, { maxExemplos: 250 })
  if (!lido.ok) {
    console.error(`[${id}] inválido, ignorado: ${lido.erros[0]}`)
    continue
  }
  // regrava a partir dos dados validados (nada do arquivo original passa direto para o repositório)
  const pacote = criarPacote(lido.exemplos, { origem: 'Sinalume — voluntários', licenca: 'CC-BY-4.0' })
  writeFileSync(`.importar/${id}.json`, JSON.stringify({ ...pacote, id, recebidoEm: dado.recebidoEm, consentimento: registro, ...(remocaoHash ? { remocaoHash } : {}) }))

  const conta = new Map<string, number>()
  lido.exemplos.forEach((e) => conta.set(e.glosa, (conta.get(e.glosa) ?? 0) + 1))
  const sinais = [...conta.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ×${n}`)
  const autores = [...new Set(lido.exemplos.map((e) => [e.autor, e.uf].filter(Boolean).join(' · ')).filter(Boolean))]
  writeFileSync(
    `.importar/${id}.titulo`,
    `Contribuição: ${lido.exemplos.length} gravações · ${sinais.slice(0, 3).join(', ')}`.slice(0, 120),
  )
  writeFileSync(
    `.importar/${id}.md`,
    [
      `**Sinais:** ${sinais.join(', ')}`,
      `**Voluntário(a):** ${autores.join('; ') || 'anônimo'}`,
      `**Recebido em:** ${dado.recebidoEm ?? '—'}`,
      '',
      `Consentimento: termo versão ${registro.versao}, aceito em ${registro.aceitoEm}, com declaração de maioridade ou autorização do responsável. Pontos das mãos, sem vídeo; licença CC BY 4.0.`,
      'Leia a verificação abaixo. Se estiver tudo certo, clique em **Merge pull request**.',
      '',
    ].join('\n'),
  )
  console.log(id)
  feitos++
}
