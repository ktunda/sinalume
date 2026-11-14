// Testes da lógica que roda sem navegador: frases, reconhecimento por DTW e quebra de frases.
// Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { glosasParaFrase } from '../src/lib/frase.ts'
import { ClassificadorDTW, dtw, reamostrar, Segmentador, type Exemplo } from '../src/lib/reconhecedor.ts'
import { DIM, type Ponto, type QuadroMaos } from '../src/lib/maos.ts'

test('glosas viram frase em português', () => {
  assert.equal(glosasParaFrase(['EU', 'QUERER', 'ÁGUA']), 'Eu quero água.')
  assert.equal(glosasParaFrase(['BANHEIRO', 'ONDE']), 'Onde fica banheiro?')
  assert.equal(glosasParaFrase(['EU', 'ENTENDER', 'NÃO']), 'Eu não entendo.')
  assert.equal(glosasParaFrase(['NÃO-ENTENDER']), 'Não entendi.')
  assert.equal(glosasParaFrase(['DEUS', 'AMOR']), 'Deus amor.')
  assert.equal(glosasParaFrase(['PRECISAR', 'MÉDICO']), 'Eu preciso médico.')
  assert.equal(glosasParaFrase([]), '')
})

test('reamostrar fixa o número de quadros', () => {
  const seq = Array.from({ length: 10 }, (_, i) => [i])
  const r = reamostrar(seq, 4)
  assert.equal(r.length, 4)
  assert.deepEqual(r[0], [0])
  assert.deepEqual(r[3], [9])
})

test('DTW tolera o mesmo movimento em velocidades diferentes', () => {
  const lento = Array.from({ length: 40 }, (_, i) => [Math.sin(i / 6)])
  const rapido = Array.from({ length: 20 }, (_, i) => [Math.sin(i / 3)])
  const outro = Array.from({ length: 30 }, () => [1])
  const dMesmo = dtw(reamostrar(lento), reamostrar(rapido))
  const dOutro = dtw(reamostrar(lento), reamostrar(outro))
  assert.ok(dMesmo < dOutro, `${dMesmo} deveria ser menor que ${dOutro}`)
})

// mão sintética: 21 pontos, abertura controla a forma, (x, y) controla a posição
function mao(x: number, y: number, abertura: number): Ponto[] {
  return Array.from({ length: 21 }, (_, i) => ({
    x: x + Math.cos(i) * 0.05 * (i === 9 ? 1 : abertura),
    y: y + Math.sin(i) * 0.05 * (i === 9 ? 1 : abertura) - (i === 9 ? 0.08 : 0),
    z: 0,
  }))
}
function gesto(tipo: 'aceno' | 'fechar', ruido: number, n = 24): number[][] {
  const quadros: QuadroMaos[] = Array.from({ length: n }, (_, i) => {
    const f = i / (n - 1)
    const p = tipo === 'aceno' ? mao(0.3 + 0.4 * f + ruido, 0.4, 1) : mao(0.5 + ruido, 0.5, 1 - 0.8 * f)
    return { direita: p, esquerda: null, t: i * 66 }
  })
  // vetorizar vem do segmentador; aqui reproduzimos pela API pública
  const seqs: number[][][] = []
  const seg = new Segmentador((s) => seqs.push(s), { semMaoMs: 100, paradoMs: 10_000, minQuadros: 4, limiarMovimento: 0.001 })
  quadros.forEach((q) => seg.alimentar(q))
  seg.alimentar({ direita: null, esquerda: null, t: n * 66 + 500 })
  assert.equal(seqs.length, 1)
  assert.equal(seqs[0][0].length, DIM)
  return seqs[0]
}

test('classificador reconhece o gesto certo e diz quando não sabe', () => {
  const ex = (glosa: string, quadros: number[][]): Exemplo => ({
    id: glosa + Math.random(), glosa, quadros: reamostrar(quadros), origem: 'gravado', criadoEm: 0,
  })
  const c = new ClassificadorDTW([
    ex('OI', gesto('aceno', 0)), ex('OI', gesto('aceno', 0.02)),
    ex('ÁGUA', gesto('fechar', 0)), ex('ÁGUA', gesto('fechar', 0.02)),
  ])
  assert.equal(c.classificar(gesto('aceno', 0.01))?.glosa, 'OI')
  assert.equal(c.classificar(gesto('fechar', 0.01))?.glosa, 'ÁGUA')
  assert.equal(new ClassificadorDTW([]).classificar(gesto('aceno', 0)), null)
})
