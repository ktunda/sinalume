// Trava de documentação: nenhuma tela entra no app sem estar no manual.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { MANUAL, manualEmMarkdown } from '../src/lib/manual.ts'

test('toda rota do app tem seção no manual', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const tipo = app.match(/export type Rota =([^\n]+)/)
  assert.ok(tipo, 'não achei o tipo Rota em src/App.tsx')
  const rotas = [...tipo[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1])
  const cobertas = new Set(MANUAL.map((s) => s.rota).filter(Boolean))
  const faltando = rotas.filter((r) => !cobertas.has(r))
  assert.deepEqual(faltando, [], `Telas sem seção no manual (src/lib/manual.ts): ${faltando.join(', ')}`)
})

test('docs/MANUAL.md está atualizado (rode npm run manual)', () => {
  const atual = readFileSync('docs/MANUAL.md', 'utf8')
  assert.equal(atual, manualEmMarkdown() + '\n', 'docs/MANUAL.md desatualizado: rode "npm run manual" e faça commit')
})

test('seções do manual têm id único e texto', () => {
  const ids = MANUAL.map((s) => s.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const s of MANUAL) assert.ok(s.resumo.length > 20, `seção ${s.id} sem resumo`)
})
