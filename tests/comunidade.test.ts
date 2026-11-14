import assert from 'node:assert/strict'
import { test } from 'node:test'
import { processarContribuicao } from '../api/_lib/contribuicao.ts'
import { selecionarVariados, type ExemploComFonte } from '../scripts/acervo-comum.ts'
import { codificar, decodificar } from '../src/lib/codec.ts'
import { criarPacote, lerPacote } from '../src/lib/pacote.ts'

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

test('função de contribuição valida e abre Pull Request no GitHub', async () => {
  const chamadas: { metodo: string; url: string; corpo?: Record<string, unknown> }[] = []
  const falsoGitHub = (async (url: string, init?: RequestInit) => {
    const metodo = init?.method ?? 'GET'
    const corpo = init?.body ? JSON.parse(String(init.body)) : undefined
    chamadas.push({ metodo, url, corpo })
    const resp = (dado: unknown) => new Response(JSON.stringify(dado), { status: 200 })
    if (url.includes('/pulls?state=open')) return resp([])
    if (url.endsWith('/git/ref/heads/main')) return resp({ object: { sha: 'abc' } })
    if (url.endsWith('/pulls') && metodo === 'POST') return resp({ number: 7, html_url: 'https://github.com/x/sinalume/pull/7' })
    return resp({})
  }) as typeof fetch

  const pacote = criarPacote([
    { glosa: 'ORAR', quadros: quadros(6), autor: 'Ana', uf: 'DF' },
    { glosa: 'ORAR', quadros: quadros(7), autor: 'Ana', uf: 'DF' },
  ])
  const cfg = { token: 't', repo: 'x/sinalume' }

  const semConsentimento = await processarContribuicao(JSON.stringify({ pacote }), cfg, falsoGitHub)
  assert.equal(semConsentimento.status, 400)
  assert.equal(chamadas.length, 0, 'não deve chamar o GitHub sem consentimento')

  const r = await processarContribuicao(JSON.stringify({ consentimento: true, pacote }), cfg, falsoGitHub)
  assert.equal(r.status, 201)
  assert.equal(r.corpo.pedido, 'https://github.com/x/sinalume/pull/7')
  const put = chamadas.find((c) => c.metodo === 'PUT')!
  assert.match(put.url, /\/contents\/acervo\/contribuicoes\/\d{4}-\d{2}\/.+\.json$/)
  const salvo = JSON.parse(Buffer.from(String(put.corpo!.content), 'base64').toString('utf8'))
  assert.equal(salvo.exemplos.length, 2)
  assert.equal(salvo.licenca, 'CC-BY-4.0')
  const pr = chamadas.find((c) => c.metodo === 'POST' && c.url.endsWith('/pulls'))!
  assert.match(String(pr.corpo!.title), /ORAR ×2/)
})
