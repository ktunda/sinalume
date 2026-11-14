// Busca as sugestões enviadas pelo app e prepara cada uma para virar uma issue no GitHub.
// Uso: API_SINALUME=https://... tsx scripts/importar-sugestoes.ts titulos-existentes.txt
// Saída: um id por linha; grava .sugestoes/<id>.titulo, .md e .rotulo
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { caminhoDoEnvio } from '../api/_lib/contribuicao'
import { limparTexto, RE_CODIGO_ENVIO, RE_ID_SUGESTAO, TIPOS_SUGESTAO, type Sugestao } from '../api/_lib/sugestao'
import { cabecalhosAutomacao } from './token-github'

const API = (process.env.API_SINALUME ?? '').replace(/\/$/, '')
const MAX = Number(process.env.MAX_POR_EXECUCAO ?? 20)
if (!API) {
  console.error('Defina API_SINALUME.')
  process.exit(1)
}
const existentes = process.argv[2] && existsSync(process.argv[2]) ? readFileSync(process.argv[2], 'utf8') : ''

const ROTULOS: Record<string, string> = {
  melhoria: 'sugestão',
  erro: 'erro',
  sinal: 'sinal',
  remocao: 'remoção',
  outro: 'sugestão',
}

const auth = await cabecalhosAutomacao()
const r = await fetch(`${API}/api/pendentes?colecao=sugestoes`, { headers: auth })
if (!r.ok) {
  console.error(`Falha ao listar sugestões: ${r.status}`)
  process.exit(1)
}
const { sugestoes } = (await r.json()) as { sugestoes: { id: string }[] }
mkdirSync('.sugestoes', { recursive: true })

/** Confere a chave de remoção com o resumo guardado no envio (no acervo ou ainda pendente). */
async function conferirChave(codigo: string, chaveHash: unknown): Promise<string> {
  let guardado: unknown
  const local = `acervo/${caminhoDoEnvio(codigo)}`
  if (existsSync(local)) guardado = (JSON.parse(readFileSync(local, 'utf8')) as { remocaoHash?: unknown }).remocaoHash
  else {
    const r = await fetch(`${API}/api/pendentes?id=${codigo}`, { headers: auth })
    if (r.ok) guardado = ((await r.json()) as { remocaoHash?: unknown }).remocaoHash
    else return '**Chave de remoção:** ⚠️ envio não encontrado — confira o código antes de agir.'
  }
  if (typeof guardado !== 'string') return '**Chave de remoção:** envio antigo, sem chave — confirme com a pessoa antes de remover.'
  if (typeof chaveHash !== 'string') return '**Chave de remoção:** ⚠️ não informada — confirme com a pessoa antes de remover.'
  return chaveHash === guardado
    ? '**Chave de remoção:** ✅ confere (pedido feito por quem enviou).'
    : '**Chave de remoção:** ❌ não confere — **não remova** sem confirmar.'
}

let feitos = 0
for (const { id } of sugestoes) {
  if (feitos >= MAX) break
  if (!RE_ID_SUGESTAO.test(id) || existentes.includes(id)) continue
  const resp = await fetch(`${API}/api/pendentes?id=${id}`, { headers: auth })
  if (!resp.ok) continue
  const s = (await resp.json()) as Partial<Sugestao>
  const tipo = (s.tipo && Object.hasOwn(TIPOS_SUGESTAO, s.tipo) ? s.tipo : 'outro') as keyof typeof TIPOS_SUGESTAO
  const texto = limparTexto(String(s.texto ?? ''))
  const resumo = texto.split('\n')[0].slice(0, 70) || TIPOS_SUGESTAO[tipo]
  const codigo = typeof s.codigoEnvio === 'string' && RE_CODIGO_ENVIO.test(s.codigoEnvio) ? s.codigoEnvio : ''
  const conferencia = tipo === 'remocao' && codigo ? await conferirChave(codigo, s.chaveHash) : ''

  writeFileSync(
    `.sugestoes/${id}.titulo`,
    tipo === 'remocao' ? `Remoção de gravações: envio ${codigo} [${id}]` : `${TIPOS_SUGESTAO[tipo]}: ${resumo} [${id}]`,
  )
  writeFileSync(`.sugestoes/${id}.rotulo`, ROTULOS[tipo])
  writeFileSync(
    `.sugestoes/${id}.md`,
    [
      `**Tipo:** ${TIPOS_SUGESTAO[tipo]}`,
      `**Recebido em:** ${s.recebidoEm ?? '—'}`,
      codigo ? `**Código do envio:** \`${codigo}\`` : '',
      conferencia,
      '',
      texto ? texto.split('\n').map((l) => `> ${l}`).join('\n') : '_(sem texto)_',
      '',
      tipo === 'remocao'
        ? [
            '### Como atender',
            `1. Apague \`acervo/contribuicoes/${codigo.slice(0, 7)}/${codigo}.json\` (se já foi aprovado) ou feche o pedido \`contribuicao/${codigo}\` (se ainda está aberto).`,
            '2. Feche esta issue com o comentário "Gravações removidas".',
            '',
            'Pedido de revogação de consentimento (LGPD): atender em até 15 dias.',
          ].join('\n')
        : '_Enviado pelo app Sinalume (aba Sugestões), sem identificação da pessoa._',
    ]
      .filter((l) => l !== '')
      .join('\n'),
  )
  console.log(id)
  feitos++
}
