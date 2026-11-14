// Busca as sugestões enviadas pelo app e prepara cada uma para virar uma issue no GitHub.
// Uso: API_SINALUME=https://... tsx scripts/importar-sugestoes.ts titulos-existentes.txt
// Saída: um id por linha; grava .sugestoes/<id>.titulo, .md e .rotulo
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { limparTexto, RE_CODIGO_ENVIO, RE_ID_SUGESTAO, TIPOS_SUGESTAO, type Sugestao } from '../api/_lib/sugestao'

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

const r = await fetch(`${API}/api/pendentes?colecao=sugestoes`)
if (!r.ok) {
  console.error(`Falha ao listar sugestões: ${r.status}`)
  process.exit(1)
}
const { sugestoes } = (await r.json()) as { sugestoes: { id: string }[] }
mkdirSync('.sugestoes', { recursive: true })

let feitos = 0
for (const { id } of sugestoes) {
  if (feitos >= MAX) break
  if (!RE_ID_SUGESTAO.test(id) || existentes.includes(id)) continue
  const resp = await fetch(`${API}/api/pendentes?id=${id}`)
  if (!resp.ok) continue
  const s = (await resp.json()) as Partial<Sugestao>
  const tipo = (s.tipo && s.tipo in TIPOS_SUGESTAO ? s.tipo : 'outro') as keyof typeof TIPOS_SUGESTAO
  const texto = limparTexto(String(s.texto ?? ''))
  const resumo = texto.split('\n')[0].slice(0, 70) || TIPOS_SUGESTAO[tipo]
  const codigo = typeof s.codigoEnvio === 'string' && RE_CODIGO_ENVIO.test(s.codigoEnvio) ? s.codigoEnvio : ''

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
