// Troca de sinais entre voluntários:
// - ENVIAR: as gravações vão para a função gratuita /api/contribuir, que abre um pedido de aprovação no GitHub.
// - BAIXAR: depois de aprovado, o sinal entra no acervo público (publicado junto com o app) e todos recebem.
import { carregarExemplos, marcarEnviados, pendentesDeEnvio, substituirComunidade } from './acervo'
import { criarPacote, lerPacote, type UF } from './pacote'
import { type IndiceAcervo } from './comunidade-tipos'
import { type Categoria } from './vocab'

export { categoriaDe, type ArquivoAcervo, type IndiceAcervo } from './comunidade-tipos'

/** Endereço da função que recebe as contribuições (configurável em .env: VITE_API_CONTRIBUIR). */
export const API_CONTRIBUIR: string =
  import.meta.env.VITE_API_CONTRIBUIR || 'https://sinalume.vercel.app/api/contribuir'

const CHAVE_VERSAO = 'sinalume:acervo:atualizadoEm'

export async function lerIndice(): Promise<IndiceAcervo | null> {
  try {
    const r = await fetch('./acervo/indice.json', { cache: 'no-cache' })
    if (!r.ok) return null
    return (await r.json()) as IndiceAcervo
  } catch {
    return null
  }
}

export function versaoLocal(): string | null {
  try {
    return localStorage.getItem(CHAVE_VERSAO)
  } catch {
    return null
  }
}

/** Baixa o acervo da comunidade (todas as categorias ou só as escolhidas). Retorna quantos sinais vieram. */
export async function baixarAcervo(categorias?: (Categoria | 'outros')[]): Promise<{ glosas: number; exemplos: number }> {
  const indice = await lerIndice()
  if (!indice) throw new Error('Não consegui baixar o acervo. Verifique a internet.')
  const escolhidos = indice.arquivos.filter((a) => !categorias || categorias.includes(a.categoria))
  const todos: { glosa: string; quadros: number[][] }[] = []
  for (const a of escolhidos) {
    const r = await fetch(`./acervo/${a.arquivo}`)
    if (!r.ok) throw new Error(`Falha ao baixar ${a.arquivo}`)
    const lido = lerPacote(await r.json())
    if (lido.ok) todos.push(...lido.exemplos)
  }
  await substituirComunidade(todos)
  try {
    localStorage.setItem(CHAVE_VERSAO, indice.atualizadoEm)
  } catch {
    /* sem localStorage: tudo bem */
  }
  return { glosas: new Set(todos.map((e) => e.glosa)).size, exemplos: todos.length }
}

export async function haAtualizacao(): Promise<boolean> {
  const indice = await lerIndice()
  return !!indice && indice.atualizadoEm !== versaoLocal()
}

export interface DadosEnvio {
  apelido?: string
  uf?: UF
  consentimento: boolean
}

export interface ResultadoEnvio {
  enviados: number
  pedido?: string
}

/** Envia à comunidade as gravações deste celular que ainda não foram enviadas. */
export async function enviarContribuicao(dados: DadosEnvio): Promise<ResultadoEnvio> {
  if (!dados.consentimento) throw new Error('É preciso concordar com o termo para enviar.')
  const pendentes = await pendentesDeEnvio()
  if (pendentes.length === 0) return { enviados: 0 }
  // envia em lotes para respeitar o limite da função
  let pedido: string | undefined
  for (let i = 0; i < pendentes.length; i += 200) {
    const lote = pendentes.slice(i, i + 200)
    const pacote = criarPacote(
      lote.map((e) => ({ glosa: e.glosa, quadros: e.quadros, autor: dados.apelido?.trim() || undefined, uf: dados.uf })),
      { origem: 'Sinalume — voluntários', licenca: 'CC-BY-4.0' },
    )
    let r: Response
    try {
      r = await fetch(API_CONTRIBUIR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentimento: true, pacote }),
      })
    } catch {
      throw new Error('Sem conexão com a base da comunidade. Suas gravações continuam salvas; tente mais tarde.')
    }
    const corpo = (await r.json().catch(() => ({}))) as { erro?: string; pedido?: string }
    if (!r.ok) throw new Error(corpo.erro ?? `Falha no envio (${r.status}). Tente mais tarde.`)
    pedido = corpo.pedido
    await marcarEnviados(lote.map((e) => e.id))
  }
  return { enviados: pendentes.length, pedido }
}

export async function resumoLocal() {
  const lista = await carregarExemplos()
  const conta = (o: string) => lista.filter((e) => e.origem === o).length
  return {
    gravados: conta('gravado'),
    pendentes: lista.filter((e) => e.origem === 'gravado' && !e.enviadoEm).length,
    importados: conta('importado'),
    comunidade: conta('comunidade'),
    glosasComunidade: new Set(lista.filter((e) => e.origem === 'comunidade').map((e) => e.glosa)).size,
  }
}
