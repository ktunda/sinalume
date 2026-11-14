// Glosas -> frase em português, por regras (sem IA paga, roda offline).
// Libras tem gramática própria; estas regras cobrem o vocabulário fechado do MVP:
// sujeito + verbo no infinitivo -> verbo conjugado, perguntas, negação.

import { VOCAB_POR_GLOSA } from './vocab'

type Pessoa = 'eu' | 'voce' | 'nos' | 'ele'

const CONJUGACAO: Record<string, Record<Pessoa, string>> = {
  QUERER: { eu: 'quero', voce: 'quer', nos: 'queremos', ele: 'quer' },
  PRECISAR: { eu: 'preciso', voce: 'precisa', nos: 'precisamos', ele: 'precisa' },
  GOSTAR: { eu: 'gosto de', voce: 'gosta de', nos: 'gostamos de', ele: 'gosta de' },
  ENTENDER: { eu: 'entendo', voce: 'entende', nos: 'entendemos', ele: 'entende' },
  IR: { eu: 'vou', voce: 'vai', nos: 'vamos', ele: 'vai' },
  VIR: { eu: 'venho', voce: 'vem', nos: 'vimos', ele: 'vem' },
  SABER: { eu: 'sei', voce: 'sabe', nos: 'sabemos', ele: 'sabe' },
  COMER: { eu: 'como', voce: 'come', nos: 'comemos', ele: 'come' },
  BEBER: { eu: 'bebo', voce: 'bebe', nos: 'bebemos', ele: 'bebe' },
  ESPERAR: { eu: 'espero', voce: 'espera', nos: 'esperamos', ele: 'espera' },
  ORAR: { eu: 'oro', voce: 'ora', nos: 'oramos', ele: 'ora' },
}

const SUJEITOS: Record<string, Pessoa> = { EU: 'eu', 'VOCÊ': 'voce', 'NÓS': 'nos', ELE: 'ele', ELA: 'ele' }
const PERGUNTAS = new Set(['ONDE', 'QUANDO', 'QUEM', 'O-QUE', 'COMO', 'POR-QUE', 'QUANTO'])
const SOZINHAS: Record<string, string> = {
  'NÃO-ENTENDER': 'Não entendi.',
  REPETIR: 'Repita, por favor.',
  DEVAGAR: 'Mais devagar, por favor.',
  OBRIGADO: 'Obrigado!',
  AMÉM: 'Amém!',
  'BEM-VINDO': 'Bem-vindo!',
}

function texto(glosa: string): string {
  return VOCAB_POR_GLOSA.get(glosa)?.texto ?? glosa.toLowerCase().replace(/-/g, ' ')
}

/** Converte uma sequência de glosas reconhecidas em uma frase legível. */
export function glosasParaFrase(glosas: string[]): string {
  if (glosas.length === 0) return ''
  if (glosas.length === 1 && SOZINHAS[glosas[0]]) return SOZINHAS[glosas[0]]

  let pessoa: Pessoa | null = null
  let pergunta = false
  const palavras: string[] = []

  for (let i = 0; i < glosas.length; i++) {
    const g = glosas[i]
    if (PERGUNTAS.has(g)) pergunta = true

    if (SUJEITOS[g]) {
      pessoa = SUJEITOS[g]
      palavras.push(texto(g))
      continue
    }
    if (g === 'NÃO') {
      // em Libras a negação costuma vir depois do verbo; em português vem antes
      const ultimo = palavras.length - 1
      if (ultimo >= 0 && i > 0 && CONJUGACAO[glosas[i - 1]]) {
        palavras.splice(ultimo, 0, 'não')
      } else {
        palavras.push('não')
      }
      continue
    }
    const conj = CONJUGACAO[g]
    if (conj) {
      palavras.push(conj[pessoa ?? 'eu'])
      if (!pessoa) palavras.unshift('eu')
      pessoa = pessoa ?? 'eu'
      continue
    }
    palavras.push(texto(g))
  }

  // perguntas em Libras costumam terminar com o pronome interrogativo: ÁGUA ONDE -> Onde (fica a) água?
  if (pergunta && PERGUNTAS.has(glosas[glosas.length - 1]) && palavras.length > 1) {
    const interrogativo = palavras.pop()!
    palavras.unshift(interrogativo)
    if (interrogativo === 'onde' && palavras.length === 2) palavras.splice(1, 0, 'fica')
  }

  let frase = palavras.join(' ').replace(/\s+/g, ' ').trim()
  frase = frase.charAt(0).toUpperCase() + frase.slice(1)
  return frase + (pergunta ? '?' : '.')
}
