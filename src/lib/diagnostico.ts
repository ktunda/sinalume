// Registro das tentativas de reconhecimento, para encontrar e corrigir divergências.
// Guarda só números (quantos quadros, mãos vistas, distâncias e o que a pessoa corrigiu),
// nunca imagem ou vídeo. Fica no celular; a pessoa decide se envia o relatório à equipe.
import type { Palpite } from './reconhecedor'

export type Desfecho = 'aceito' | 'duvida' | 'confirmado' | 'corrigido' | 'juntado'

export interface Tentativa {
  em: number
  quadros: number
  /** fração dos quadros com mão direita / esquerda visível (0..1) */
  direita: number
  esquerda: number
  conhecidos: number
  palpites: { glosa: string; distancia: number }[]
  confianca: number
  desfecho: Desfecho
  /** sinal certo, quando a pessoa corrigiu */
  certo?: string
}

const CHAVE = 'sinalume:diagnostico'
const MAX = 60

export function lerTentativas(): Tentativa[] {
  try {
    const l = JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as unknown
    return Array.isArray(l) ? (l as Tentativa[]) : []
  } catch {
    return []
  }
}

function salvar(l: Tentativa[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(l.slice(-MAX)))
  } catch {
    /* sem espaço: tudo bem */
  }
}

/** Presença de cada mão ao longo do sinal (índices 65 e 131 do vetor = mão presente). */
export function presencaMaos(seq: number[][]): { direita: number; esquerda: number } {
  if (seq.length === 0) return { direita: 0, esquerda: 0 }
  const d = seq.filter((q) => q[65] === 1).length / seq.length
  const e = seq.filter((q) => q[131] === 1).length / seq.length
  return { direita: Math.round(d * 100) / 100, esquerda: Math.round(e * 100) / 100 }
}

export function registrar(seq: number[][], p: Palpite | null, conhecidos: number, desfecho: Desfecho): number {
  const l = lerTentativas()
  const t: Tentativa = {
    em: Date.now(),
    quadros: seq.length,
    ...presencaMaos(seq),
    conhecidos,
    palpites: (p?.alternativas ?? []).map((a) => ({ glosa: a.glosa, distancia: Math.round(a.distancia * 1000) / 1000 })),
    confianca: Math.round((p?.confianca ?? 0) * 100) / 100,
    desfecho,
  }
  l.push(t)
  salvar(l)
  return t.em
}

/** Atualiza o desfecho de uma tentativa (quando a pessoa confirma ou corrige). */
export function marcar(em: number, desfecho: Desfecho, certo?: string) {
  const l = lerTentativas()
  const t = l.find((x) => x.em === em)
  if (!t) return
  t.desfecho = desfecho
  if (certo) t.certo = certo
  salvar(l)
}

export function limparTentativas() {
  salvar([])
}

/** Resumo em texto (cabe numa sugestão: até ~1.900 caracteres), só com números e glosas. */
export function relatorio(navegador: string): string {
  const l = lerTentativas().slice(-25)
  const linhas = l.map((t) => {
    const p = t.palpites.map((a) => `${a.glosa}:${a.distancia}`).join(',')
    return `${new Date(t.em).toISOString().slice(5, 16)} q${t.quadros} D${t.direita} E${t.esquerda} c${t.confianca} ${t.desfecho}${t.certo ? '=' + t.certo : ''} [${p}]`
  })
  let txt = `Relatório de reconhecimento (${l.length} tentativas, ${navegador})\n` + linhas.join('\n')
  while (txt.length > 1900 && linhas.length > 1) {
    linhas.shift()
    txt = `Relatório de reconhecimento (${linhas.length} tentativas, ${navegador})\n` + linhas.join('\n')
  }
  return txt
}
