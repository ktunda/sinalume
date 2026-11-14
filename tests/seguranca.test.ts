// Testes das proteções de segurança (revisão de 13/11/2026).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet } from 'jose'
import { AUDIENCIA, conferirAutomacao, EMISSOR_GITHUB } from '../api/_lib/auth.ts'
import { processarContribuicao, resumoChave, RE_CHAVE } from '../api/_lib/contribuicao.ts'
import { limparTexto, processarSugestao } from '../api/_lib/sugestao.ts'
import { criarPacote, lerPacote, limparAutor } from '../src/lib/pacote.ts'
import { novoConsentimento } from '../src/lib/termo.ts'

const regras = { repositorio: 'ktunda/sinalume', ramo: 'refs/heads/main' }

async function chaves() {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }
  const assinar = (claims: Record<string, unknown>, o: { iss?: string; aud?: string; chave?: CryptoKey } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(o.iss ?? EMISSOR_GITHUB)
      .setAudience(o.aud ?? AUDIENCIA)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(o.chave ?? privateKey)
  return { jwks: createLocalJWKSet({ keys: [jwk] }), assinar }
}

test('pendentes: só aceita token OIDC do repositório oficial, ramo main, fora de PR', async () => {
  const { jwks, assinar } = await chaves()
  const bom = { repository: 'ktunda/sinalume', ref: 'refs/heads/main', event_name: 'schedule' }
  assert.equal(await conferirAutomacao(`Bearer ${await assinar(bom)}`, jwks, regras), null)
  assert.notEqual(await conferirAutomacao(null, jwks, regras), null, 'sem token')
  assert.notEqual(await conferirAutomacao('Bearer abc.def.ghi', jwks, regras), null, 'token lixo')
  assert.notEqual(await conferirAutomacao(`Bearer ${await assinar({ ...bom, repository: 'invasor/sinalume' })}`, jwks, regras), null)
  assert.notEqual(await conferirAutomacao(`Bearer ${await assinar({ ...bom, ref: 'refs/heads/teste' })}`, jwks, regras), null)
  assert.notEqual(await conferirAutomacao(`Bearer ${await assinar({ ...bom, event_name: 'pull_request_target' })}`, jwks, regras), null)
  assert.notEqual(await conferirAutomacao(`Bearer ${await assinar(bom, { aud: 'outra' })}`, jwks, regras), null)
  assert.notEqual(await conferirAutomacao(`Bearer ${await assinar(bom, { iss: 'https://falso.example' })}`, jwks, regras), null)
  const outra = await generateKeyPair('RS256')
  assert.notEqual(await conferirAutomacao(`Bearer ${await assinar(bom, { chave: outra.privateKey })}`, jwks, regras), null, 'assinatura de outra chave')
})

test('contribuição devolve chave de remoção e guarda só o resumo', async () => {
  let salvo = ''
  const pacote = criarPacote([{ glosa: 'PAZ', quadros: Array.from({ length: 32 }, () => Array.from({ length: 132 }, (_, k) => (k === 65 ? 1 : 0.1))) }])
  const r = await processarContribuicao(JSON.stringify({ consentimento: novoConsentimento(), pacote }), async (_c, t) => {
    salvo = t
  })
  assert.equal(r.status, 201)
  const chave = String(r.corpo.chave)
  assert.match(chave, RE_CHAVE)
  assert.ok(!salvo.includes(chave), 'a chave não pode ser guardada')
  assert.equal(JSON.parse(salvo).remocaoHash, await resumoChave(chave))
})

test('remoção guarda o resumo da chave, nunca a chave', async () => {
  const salvos: string[] = []
  const salvar = async (_c: string, t: string) => void salvos.push(t)
  const chave = 'a'.repeat(32)
  const r = await processarSugestao(JSON.stringify({ tipo: 'remocao', codigoEnvio: '2026-11-14-a1b2c3d4', chave }), salvar)
  assert.equal(r.status, 201)
  assert.equal(JSON.parse(salvos[0]).chaveHash, await resumoChave(chave))
  assert.ok(!salvos[0].includes(chave))
  assert.equal((await processarSugestao(JSON.stringify({ tipo: 'remocao', codigoEnvio: '2026-11-14-a1b2c3d4', chave: 'x' }), salvar)).status, 422)
})

test('tipo de sugestão não aceita nomes herdados (toString, constructor, __proto__)', async () => {
  const salvar = async () => {}
  for (const tipo of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
    assert.equal((await processarSugestao(JSON.stringify({ tipo, texto: 'texto de teste' }), salvar)).status, 422, tipo)
  }
})

test('texto de sugestão vira texto puro (sem HTML, imagem escondida ou menção)', () => {
  const t = limparTexto('<img src=x onerror=alert(1)> ![rastreio](https://x.io/p.png) @todos')
  assert.ok(!t.includes('<img'))
  assert.ok(!t.includes('!['))
  assert.ok(!t.includes('@t'))
})

test('apelido do voluntário vira texto simples', () => {
  assert.equal(limparAutor('  Ana <b>Maria</b> [link](http://x) @fulano '), 'Ana bMariab linkhttpx fulano')
  assert.equal(limparAutor('João d’Ávila-Souza'), 'João dÁvila-Souza')
  const p = criarPacote([{ glosa: 'PAZ', autor: '<script>', quadros: Array.from({ length: 32 }, () => Array.from({ length: 132 }, (_, k) => (k === 65 ? 1 : 0.1))) }])
  const r = lerPacote(JSON.parse(JSON.stringify(p)))
  assert.ok(r.ok && r.exemplos[0].autor === 'script')
})
