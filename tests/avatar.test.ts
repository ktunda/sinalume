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

import { ClassificadorDTW, espelhar } from '../src/lib/reconhecedor.ts'

test('sinal espelhado (outra mão) também é reconhecido', () => {
  const sinal = (k: number) =>
    Array.from({ length: 32 }, (_, t) =>
      Array.from({ length: 132 }, (_, i) => (i === 65 ? 1 : i < 63 ? Math.sin(t / 4 + i * k) : i === 63 ? 0.4 : 0)),
    )
  const a = sinal(1)
  assert.deepEqual(espelhar(espelhar(a)), a, 'espelhar duas vezes volta ao original')
  const c = new ClassificadorDTW([
    { id: '1', glosa: 'BOM-DIA', quadros: a, origem: 'gravado', criadoEm: 0 },
    { id: '2', glosa: 'OBRIGADO', quadros: sinal(2.7), origem: 'gravado', criadoEm: 0 },
  ] as never)
  assert.equal(c.classificar(espelhar(a))?.glosa, 'BOM-DIA')
  assert.deepEqual(c.glosasConhecidas.sort(), ['BOM-DIA', 'OBRIGADO'])
})
