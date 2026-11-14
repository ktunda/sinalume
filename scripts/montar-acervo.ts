// Monta o acervo público que o app baixa (public/acervo/), a partir de:
//   acervo/base/            pacotes de bancos públicos (ex.: pacote-vlibrasil.json, gerado por training/gerar_pacote.py)
//   acervo/contribuicoes/   gravações de voluntários aprovadas (cada Pull Request aceito adiciona um arquivo)
// Roda automaticamente antes de cada build (npm run build) e no GitHub Actions.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { categoriaDe, type ArquivoAcervo, type IndiceAcervo, type SituacaoSinal } from '../src/lib/comunidade-tipos'
import { criarPacote } from '../src/lib/pacote'
import { lerAcervo, selecionarVariados } from './acervo-comum'

const MAX_POR_GLOSA = Number(process.env.MAX_POR_GLOSA ?? 8)
const SAIDA = 'public/acervo'

const todos = lerAcervo(['acervo/base', 'acervo/contribuicoes'])
const escolhidos = selecionarVariados(todos, MAX_POR_GLOSA)

rmSync(SAIDA, { recursive: true, force: true })
mkdirSync(SAIDA, { recursive: true })

const porCategoria = new Map<string, typeof escolhidos>()
for (const e of escolhidos) {
  const c = categoriaDe(e.glosa)
  porCategoria.set(c, [...(porCategoria.get(c) ?? []), e])
}

const arquivos: ArquivoAcervo[] = []
for (const [categoria, lista] of [...porCategoria.entries()].sort()) {
  const nome = `${categoria}.json`
  const texto = JSON.stringify(
    criarPacote(
      lista.map(({ glosa, quadros, uf }) => ({ glosa, quadros, uf })),
      { origem: 'Acervo da comunidade Sinalume', licenca: 'CC-BY-4.0' },
    ),
  )
  writeFileSync(join(SAIDA, nome), texto)
  arquivos.push({
    categoria: categoria as ArquivoAcervo['categoria'],
    arquivo: nome,
    glosas: new Set(lista.map((e) => e.glosa)).size,
    exemplos: lista.length,
    bytes: Buffer.byteLength(texto),
  })
}

// situação de cada sinal considerando TODOS os envios aprovados (não só os publicados)
const situacao = new Map<string, { exemplos: number; fontes: Set<string>; ufs: Set<string> }>()
for (const e of todos) {
  const s = situacao.get(e.glosa) ?? { exemplos: 0, fontes: new Set<string>(), ufs: new Set<string>() }
  s.exemplos++
  s.fontes.add(e.fonte)
  if (e.uf) s.ufs.add(e.uf)
  situacao.set(e.glosa, s)
}
const sinais: SituacaoSinal[] = [...situacao.entries()]
  .map(([glosa, s]) => ({
    glosa,
    categoria: categoriaDe(glosa),
    exemplos: s.exemplos,
    pessoas: s.fontes.size,
    ufs: [...s.ufs].sort(),
  }))
  .sort((a, b) => a.glosa.localeCompare(b.glosa, 'pt-BR'))

const indice: IndiceAcervo = {
  formato: 'sinalume-acervo',
  versao: 1,
  atualizadoEm: new Date().toISOString(),
  totalGlosas: new Set(escolhidos.map((e) => e.glosa)).size,
  totalExemplos: escolhidos.length,
  arquivos,
  sinais,
}
writeFileSync(join(SAIDA, 'indice.json'), JSON.stringify(indice, null, 2))
console.log(
  `[acervo] ${indice.totalGlosas} sinais, ${indice.totalExemplos} exemplos publicados ` +
    `(de ${todos.length} recebidos; máx. ${MAX_POR_GLOSA} por sinal)`,
)
