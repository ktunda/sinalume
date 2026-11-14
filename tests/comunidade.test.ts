import assert from 'node:assert/strict'
import { test } from 'node:test'
import { processarContribuicao, RE_ID } from '../api/_lib/contribuicao.ts'
import { selecionarVariados, type ExemploComFonte } from '../scripts/acervo-comum.ts'
import { codificar, decodificar } from '../src/lib/codec.ts'
import { criarPacote, lerPacote } from '../src/lib/pacote.ts'
import { novoConsentimento } from '../src/lib/termo.ts'
import { processarSugestao } from '../api/_lib/sugestao.ts'

// sinal sintético com mão presente (índice 65 = presença da mão direita)
function quadros(semente: number): number[][] {
  return Array.from({ length: 32 }, (_, t) =>
    Array.from({ length: 132 }, (_, k) => (k === 65 ? 1 : k > 65 ? 0 : Math.sin(t / 5 + k + semente) * 2)),
  )
}

test('codec int8 preserva os valores com erro máximo de 1/64', () => {
  const q = quadros(1)
  const volta = decodificar(codificar(q))
  let erro = 0
  q.forEach((l, t) => l.forEach((v, k) => (erro = Math.max(erro, Math.abs(v - volta[t][k])))))
  assert.ok(erro <= 1 / 64 + 1e-9, `erro ${erro}`)
  assert.ok(codificar(q).length < 6000, 'exemplo deve ocupar menos de 6 KB')
})

test('lerPacote aceita pacote válido e normaliza glosa', () => {
  const p = criarPacote([{ glosa: 'água', quadros: quadros(2), autor: 'Ana', uf: 'GO' }])
  const r = lerPacote(JSON.parse(JSON.stringify(p)))
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.exemplos[0].glosa, 'ÁGUA')
    assert.equal(r.exemplos[0].uf, 'GO')
  }
})

test('lerPacote recusa lixo, glosa perigosa e sinal sem mão', () => {
  assert.equal(lerPacote({ formato: 'outro' }).ok, false)
  const ruim = criarPacote([{ glosa: 'OK', quadros: quadros(3) }])
  ruim.exemplos[0].glosa = '<script>alert(1)</script>'
  assert.equal(lerPacote(ruim).ok, false)
  const semMao = criarPacote([{ glosa: 'NADA', quadros: quadros(4).map((l) => l.map(() => 0)) }])
  assert.equal(lerPacote(semMao).ok, false)
  const curto = criarPacote([{ glosa: 'OI', quadros: quadros(5) }])
  curto.exemplos[0].q = 'AAAA'
  assert.equal(lerPacote(curto).ok, false)
})

test('seleção do acervo alterna entre pessoas e respeita o máximo', () => {
  const ex = (glosa: string, fonte: string): ExemploComFonte => ({ glosa, fonte, arquivo: fonte, quadros: [] })
  const lista = [
    ...Array.from({ length: 10 }, () => ex('DEUS', 'ana')),
    ex('DEUS', 'bia'),
    ex('DEUS', 'caio'),
    ex('PAZ', 'ana'),
  ]
  const s = selecionarVariados(lista, 4)
  const deus = s.filter((e) => e.glosa === 'DEUS')
  assert.equal(deus.length, 4)
  assert.deepEqual(new Set(deus.map((e) => e.fonte)), new Set(['ana', 'bia', 'caio']))
  assert.equal(s.filter((e) => e.glosa === 'PAZ').length, 1)
})

test('função de contribuição valida, recusa sem consentimento e guarda pacote limpo', async () => {
  const salvos: { caminho: string; conteudo: string }[] = []
  const salvar = async (caminho: string, conteudo: string) => {
    salvos.push({ caminho, conteudo })
  }
  const pacote = criarPacote([
    { glosa: 'ORAR', quadros: quadros(6), autor: 'Ana', uf: 'DF' },
    { glosa: 'ORAR', quadros: quadros(7), autor: 'Ana', uf: 'DF' },
  ])
  const sem = await processarContribuicao(JSON.stringify({ pacote }), salvar)
  assert.equal(sem.status, 400)
  assert.equal(salvos.length, 0, 'não deve guardar nada sem consentimento')

  const antigo = await processarContribuicao(JSON.stringify({ consentimento: true, pacote }), salvar)
  assert.equal(antigo.status, 400, 'consentimento sem termo/idade deve ser recusado')
  const semIdade = { ...novoConsentimento(), maiorIdadeOuResponsavel: false }
  assert.equal((await processarContribuicao(JSON.stringify({ consentimento: semIdade, pacote }), salvar)).status, 400)

  const lixo = await processarContribuicao(JSON.stringify({ consentimento: novoConsentimento(), pacote: { formato: 'x' } }), salvar)
  assert.equal(lixo.status, 422)

  const agora = new Date('2026-11-14T12:00:00Z')
  const consentimento = { ...novoConsentimento(), extra: 'não deve ser guardado' }
  const r = await processarContribuicao(JSON.stringify({ consentimento, pacote }), salvar, agora)
  assert.equal(r.status, 201)
  const id = String(r.corpo.id)
  assert.match(id, RE_ID)
  assert.equal(salvos[0].caminho, `contribuicoes/2026-11/${id}.json`)
  const salvo = JSON.parse(salvos[0].conteudo)
  assert.equal(salvo.exemplos.length, 2)
  assert.equal(salvo.licenca, 'CC-BY-4.0')
  assert.equal(lerPacote(salvo).ok, true)
  assert.equal(salvo.consentimento.versao, consentimento.versao)
  assert.equal(salvo.consentimento.maiorIdadeOuResponsavel, true)
  assert.equal(salvo.consentimento.extra, undefined)
})

test('sugestões: valida tipo, exige código na remoção e neutraliza menções', async () => {
  const salvos: string[] = []
  const salvar = async (_c: string, conteudo: string) => {
    salvos.push(conteudo)
  }
  assert.equal((await processarSugestao(JSON.stringify({ tipo: 'hackear', texto: 'oi oi oi' }), salvar)).status, 422)
  assert.equal((await processarSugestao(JSON.stringify({ tipo: 'melhoria', texto: 'oi' }), salvar)).status, 422)
  assert.equal((await processarSugestao(JSON.stringify({ tipo: 'remocao', texto: '' }), salvar)).status, 422)
  const ok = await processarSugestao(JSON.stringify({ tipo: 'melhoria', texto: 'Modo noturno, por favor @fulano' }), salvar)
  assert.equal(ok.status, 201)
  assert.ok(!JSON.parse(salvos[0]).texto.includes('@f'), 'menção deve ser neutralizada')
  const rem = await processarSugestao(JSON.stringify({ tipo: 'remocao', codigoEnvio: '2026-11-14-a1b2c3d4' }), salvar)
  assert.equal(rem.status, 201)
  assert.equal(JSON.parse(salvos[1]).codigoEnvio, '2026-11-14-a1b2c3d4')
})
