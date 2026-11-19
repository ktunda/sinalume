import assert from 'node:assert/strict'
import { test } from 'node:test'
import { glosaSimples, quebrarFrases } from '../src/lib/vlibras.ts'

test('tradução simplificada (tradutor fora do ar) vira palavras em maiúsculas', () => {
  assert.equal(glosaSimples('Bom dia, irmão! Tudo bem?'), 'BOM DIA IRMÃO TUDO BEM')
  assert.equal(glosaSimples('   '), '')
})

test('frases longas são quebradas em partes curtas', () => {
  const partes = quebrarFrases('um dois três quatro cinco seis sete oito nove dez onze doze treze. Fim.')
  assert.equal(partes.length, 3)
})
