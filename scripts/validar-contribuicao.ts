// Verificação automática de uma contribuição (roda em cada Pull Request).
// - Confere o formato (falha o check se estiver inválido)
// - Compara cada gravação com o acervo atual: avisa se um "ÁGUA" parece mais com outro sinal
// - Mede a coerência entre as repetições do mesmo sinal na própria contribuição
// Uso: tsx scripts/validar-contribuicao.ts arquivo1.json [arquivo2.json …] > relatorio.md
import { ClassificadorDTW, dtw, type Exemplo } from '../src/lib/reconhecedor'
import { lerAcervo, lerArquivo } from './acervo-comum'

const arquivos = process.argv.slice(2).filter((a) => a.endsWith('.json'))
if (arquivos.length === 0) {
  console.log('Nenhum arquivo de contribuição neste pedido.')
  process.exit(0)
}

const existentes = lerAcervo(['acervo/base', 'acervo/contribuicoes'], new Set(arquivos))
const classificador = new ClassificadorDTW(
  existentes.map(
    (e, i): Exemplo => ({ id: String(i), glosa: e.glosa, quadros: e.quadros, origem: 'comunidade', criadoEm: 0 }),
  ),
)
const conhecidas = new Set(existentes.map((e) => e.glosa))

const linhas: string[] = ['## Verificação automática da contribuição', '']
let invalido = false
let alertas = 0

for (const arq of arquivos) {
  const { exemplos, erros } = lerArquivo(arq)
  linhas.push(`### \`${arq}\``, '')
  if (erros.length) {
    invalido = true
    linhas.push('❌ **Formato inválido** — não aprove:', '', ...erros.slice(0, 15).map((e) => `- ${e}`), '')
    continue
  }
  linhas.push('| Sinal | Gravações | Novo no acervo? | Reconhecido como | Coerência entre repetições | Situação |')
  linhas.push('| --- | --- | --- | --- | --- | --- |')

  const porGlosa = new Map<string, typeof exemplos>()
  exemplos.forEach((e) => porGlosa.set(e.glosa, [...(porGlosa.get(e.glosa) ?? []), e]))

  for (const [glosa, lista] of [...porGlosa.entries()].sort()) {
    const novo = !conhecidas.has(glosa)
    // como o acervo atual classificaria cada repetição
    const votos = new Map<string, number>()
    if (!novo || conhecidas.size > 0) {
      for (const e of lista) {
        const p = classificador.classificar(e.quadros)
        if (p) votos.set(p.glosa, (votos.get(p.glosa) ?? 0) + 1)
      }
    }
    const [maisVotada, nVotos] = [...votos.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['—', 0]
    // coerência: distância média entre as repetições (quanto menor, mais parecidas)
    let soma = 0
    let pares = 0
    for (let i = 0; i < lista.length; i++)
      for (let j = i + 1; j < lista.length; j++) {
        soma += dtw(lista[i].quadros, lista[j].quadros)
        pares++
      }
    const coerencia = pares ? soma / pares : 0
    const incoerente = pares > 0 && coerencia > 1.4

    let situacao = '✅ ok'
    if (!novo && maisVotada !== glosa && nVotos > lista.length / 2) {
      situacao = `⚠️ parece **${maisVotada}** — confira se o sinal está certo`
      alertas++
    } else if (incoerente) {
      situacao = '⚠️ repetições muito diferentes entre si'
      alertas++
    } else if (lista.length < 3) {
      situacao = 'ℹ️ poucas repetições (ideal: 5)'
    }
    linhas.push(
      `| ${glosa} | ${lista.length} | ${novo ? 'sim, sinal novo' : 'não'} | ${novo ? '—' : `${maisVotada} (${nVotos}/${lista.length})`} | ${pares ? coerencia.toFixed(2) : '—'} | ${situacao} |`,
    )
  }
  linhas.push('')
}

linhas.push(
  invalido
    ? '**Resultado:** formato inválido. Feche este pedido sem aprovar.'
    : alertas
      ? `**Resultado:** ${alertas} alerta(s). Se possível, peça a um intérprete para conferir antes de aprovar.`
      : '**Resultado:** tudo certo. Pode aprovar (Merge).',
  '',
  '<sub>Coerência = distância média entre repetições do mesmo sinal (DTW). Abaixo de 1,4 é o esperado.</sub>',
)
console.log(linhas.join('\n'))
process.exit(invalido ? 1 : 0)
