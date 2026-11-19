import assert from 'node:assert/strict'
import { test } from 'node:test'
import { relatorio } from '../src/lib/diagnostico.ts'
import { Segmentador } from '../src/lib/reconhecedor.ts'

// quadro de mão sintético: 21 pontos com posição (x, y) do pulso
function quadro(t: number, x: number, comMao = true) {
  const pontos = Array.from({ length: 21 }, (_, i) => ({ x: x + i * 0.001, y: 0.5 + i * 0.002, z: 0 }))
  return { direita: comMao ? pontos : null, esquerda: null, t }
}

test('gravação: sinal com pausa no meio (BOM … DIA) vira um exemplo só', () => {
  const normal: number[] = []
  const gravacao: number[] = []
  const sNormal = new Segmentador((s) => normal.push(s.length))
  const sGrav = new Segmentador((s) => gravacao.push(s.length), { soSemMao: true, maxQuadros: 150 })
  let t = 0
  const passo = (x: number, mao = true) => {
    t += 66
    sNormal.alimentar(quadro(t, x, mao))
    sGrav.alimentar(quadro(t, x, mao))
  }
  for (let i = 0; i < 12; i++) passo(0.3 + i * 0.02) // BOM: movimento
  for (let i = 0; i < 16; i++) passo(0.54) // pausa de ~1 s parada
  for (let i = 0; i < 12; i++) passo(0.54 - i * 0.02) // DIA: movimento
  for (let i = 0; i < 8; i++) passo(0, false) // abaixa as mãos
  assert.equal(gravacao.length, 1, 'na gravação, um sinal só')
  assert.ok(normal.length >= 2, 'na conversa, a pausa corta em dois pedaços (que o app tenta juntar)')
})

test('relatório de diagnóstico cabe numa sugestão', () => {
  const r = relatorio('android')
  assert.ok(r.length <= 1900)
})
