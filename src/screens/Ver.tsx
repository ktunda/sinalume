import { useEffect, useMemo, useRef, useState } from 'react'
import { useCameraMaos } from '../components/useCameraMaos'
import { VisorCamera } from '../components/VisorCamera'
import { adicionarExemplo, carregarExemplos } from '../lib/acervo'
import { API_BASE, baixarAcervo } from '../lib/comunidade'
import { lerTentativas, limparTentativas, marcar, registrar, relatorio, type Tentativa } from '../lib/diagnostico'
import { glosasParaFrase } from '../lib/frase'
import { ehAndroid, ehIOS } from '../lib/plataforma'
import { ClassificadorDTW, Segmentador, type Palpite } from '../lib/reconhecedor'
import { VOCAB_POR_GLOSA, VOCABULARIO } from '../lib/vocab'
import { falar } from '../lib/voz'
import type { Rota } from '../App'

const CONFIANCA_MINIMA = 0.35
const PAUSA_FIM_FRASE_MS = 2500
/** dois pedaços com menos que isso entre eles podem ser um sinal só (ex.: BOM + DIA) */
const JANELA_JUNTAR_MS = 2500

const nomeDe = (g: string) => VOCAB_POR_GLOSA.get(g)?.texto ?? g.toLowerCase().replace(/-/g, ' ')

interface Duvida {
  seq: number[][]
  palpite: Palpite | null
  tentativa: number
}

/** Fluxo 1: o ouvinte aponta a câmera para o surdo; os sinais viram texto e voz. */
export function Ver({ ir, grande = false }: { ir: (r: Rota) => void; grande?: boolean }) {
  const [classificador, setClassificador] = useState<ClassificadorDTW | null>(null)
  const [glosas, setGlosas] = useState<string[]>([])
  const [ultimo, setUltimo] = useState<{ palpite: Palpite; seq: number[][]; tentativa: number } | null>(null)
  const [duvida, setDuvida] = useState<Duvida | null>(null)
  const [corrigindo, setCorrigindo] = useState(false)
  const [capturando, setCapturando] = useState(false)
  const [vozLigada, setVozLigada] = useState(true)
  const [aviso, setAviso] = useState('')
  const timerFrase = useRef<number | undefined>(undefined)
  const pendente = useRef<{ seq: number[][]; fim: number } | null>(null)

  const [baixando, setBaixando] = useState(false)
  const [erroAcervo, setErroAcervo] = useState('')
  const recarregar = () => carregarExemplos().then((ex) => setClassificador(new ClassificadorDTW(ex)))
  useEffect(() => {
    recarregar()
    // ao sair da tela, não fala uma frase antiga depois
    return () => window.clearTimeout(timerFrase.current)
  }, [])
  const mudarFrase = (f: (g: string[]) => string[]) => {
    window.clearTimeout(timerFrase.current)
    setGlosas(f)
  }
  const baixar = async () => {
    setBaixando(true)
    setErroAcervo('')
    try {
      const r = await baixarAcervo()
      await recarregar()
      if (r.glosas === 0) setErroAcervo('A base da comunidade ainda não tem sinais aprovados. Grave os seus em "Gravar meus sinais": em poucos minutos o app já reconhece você.')
    } catch (e) {
      setErroAcervo((e as Error).message)
    } finally {
      setBaixando(false)
    }
  }

  const frase = useMemo(() => glosasParaFrase(glosas), [glosas])
  const conhecidos = classificador?.glosasConhecidas.length ?? 0

  const acrescentar = (glosa: string) => {
    setGlosas((g) => {
      const novas = [...g, glosa]
      // sem novo sinal por um tempo: a frase acabou, fala em voz alta
      window.clearTimeout(timerFrase.current)
      timerFrase.current = window.setTimeout(() => {
        if (vozLigada) falar(glosasParaFrase(novas))
      }, PAUSA_FIM_FRASE_MS)
      return novas
    })
  }

  const segmentador = useMemo(
    () =>
      new Segmentador((seq) => {
        if (!classificador || classificador.glosasConhecidas.length === 0) return
        const n = classificador.glosasConhecidas.length
        const agora = performance.now()
        let p = classificador.classificar(seq)
        let usado = seq
        let juntou = false
        // sinal composto cortado ao meio (pausa entre BOM e DIA): tenta o pedaço anterior + este
        const ant = pendente.current
        if (ant && agora - ant.fim < JANELA_JUNTAR_MS) {
          const junto = [...ant.seq, ...seq]
          const pj = classificador.classificar(junto)
          if (pj && (!p || pj.confianca > p.confianca)) {
            p = pj
            usado = junto
            juntou = true
          }
        }
        if (p && p.confianca >= CONFIANCA_MINIMA) {
          pendente.current = null
          const t = registrar(usado, p, n, juntou ? 'juntado' : 'aceito')
          setDuvida(null)
          setCorrigindo(false)
          setUltimo({ palpite: p, seq: usado, tentativa: t })
          acrescentar(p.glosa)
          return
        }
        // não teve certeza: guarda o pedaço (pode ser a 1ª metade de um sinal) e pergunta
        pendente.current = { seq: usado, fim: agora }
        const t = registrar(usado, p, n, 'duvida')
        setCorrigindo(false)
        setDuvida({ seq: usado, palpite: p, tentativa: t })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classificador, vozLigada],
  )

  const cam = useCameraMaos((q) => {
    segmentador.alimentar(q)
    if (segmentador.capturando !== capturando) setCapturando(segmentador.capturando)
  })

  /** Ensina o app com a gravação que acabou de acontecer (confirmação ou correção). */
  const ensinar = async (seq: number[][], glosa: string, tentativa: number, desfecho: 'confirmado' | 'corrigido') => {
    marcar(tentativa, desfecho, glosa)
    await adicionarExemplo(glosa, seq)
    await recarregar()
    setAviso(`Aprendido: “${nomeDe(glosa)}”. Da próxima vez o app reconhece melhor.`)
    window.setTimeout(() => setAviso(''), 5000)
  }

  const confirmarDuvida = async (glosa: string, desfecho: 'confirmado' | 'corrigido') => {
    if (!duvida) return
    const d = duvida
    pendente.current = null
    setDuvida(null)
    setCorrigindo(false)
    acrescentar(glosa)
    await ensinar(d.seq, glosa, d.tentativa, desfecho)
  }

  const corrigirUltimo = async (glosa: string) => {
    if (!ultimo) return
    const u = ultimo
    setCorrigindo(false)
    mudarFrase((g) => [...g.slice(0, -1), glosa])
    setUltimo(null)
    await ensinar(u.seq, glosa, u.tentativa, 'corrigido')
  }

  // opções para "era outro sinal": os que o app conhece primeiro, depois o vocabulário inicial
  const opcoes = useMemo(() => {
    const conhecidas = classificador?.glosasConhecidas ?? []
    const resto = VOCABULARIO.map((v) => v.glosa).filter((g) => !conhecidas.includes(g))
    return [...conhecidas, ...resto]
  }, [classificador])

  const seletor = (aoEscolher: (g: string) => void) => (
    <label className="ver__corrigir">
      Qual era o sinal?
      <select defaultValue="" onChange={(e) => e.target.value && aoEscolher(e.target.value)}>
        <option value="" disabled>
          Escolha o sinal certo…
        </option>
        {opcoes.map((g) => (
          <option key={g} value={g}>
            {nomeDe(g)}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className={grande ? 'ver ver--grande' : 'tela tela--ver'}>
      <VisorCamera
        videoRef={cam.videoRef}
        canvasRef={cam.canvasRef}
        estado={cam.estado}
        erro={cam.erro}
        maosVisiveis={cam.maosVisiveis}
        espelhar={!cam.traseira}
        capturando={capturando}
        aoAlternar={cam.alternarCamera}
      />

      {classificador && conhecidos === 0 && (
        <div className="aviso-card">
          <p>
            <strong>O app ainda não conhece nenhum sinal neste celular.</strong> Ele aprende com gravações: grave um
            sinal (por exemplo, “bom dia”) 5 vezes em Ensinar sinais e volte aqui. Também dá para baixar os sinais
            aprovados da comunidade.
          </p>
          <button type="button" className="botao-principal" onClick={() => ir('ensinar')}>
            Gravar meus sinais
          </button>
          <button type="button" onClick={baixar} disabled={baixando}>
            {baixando ? 'Baixando…' : '⬇ Baixar sinais da comunidade'}
          </button>
          {erroAcervo && <p className="nota">{erroAcervo}</p>}
        </div>
      )}

      <div className="resultado" aria-live="polite">
        <p className={`resultado__frase ${frase ? '' : 'resultado__frase--vazia'}`}>{frase || 'Os sinais reconhecidos viram frase aqui.'}</p>

        {duvida && conhecidos > 0 && (
          <div className="resultado__duvida">
            {duvida.palpite ? (
              <>
                <p>
                  Parece <strong>“{nomeDe(duvida.palpite.glosa)}”</strong>, mas não tenho certeza (
                  {Math.round(duvida.palpite.confianca * 100)}%). Está certo?
                </p>
                <div className="ver__botoes">
                  <button type="button" className="botao-principal" onClick={() => confirmarDuvida(duvida.palpite!.glosa, 'confirmado')}>
                    Sim, é esse
                  </button>
                  <button type="button" onClick={() => setCorrigindo(true)}>
                    Não, era outro
                  </button>
                  <button type="button" onClick={() => setDuvida(null)}>
                    Ignorar
                  </button>
                </div>
              </>
            ) : (
              <p>Não reconheci esse sinal. Pode repetir mais devagar?</p>
            )}
            {(corrigindo || !duvida.palpite) && seletor((g) => confirmarDuvida(g, 'corrigido'))}
            <p className="nota">
              Ao confirmar ou corrigir, o app guarda este sinal e aprende. Este celular conhece {conhecidos}{' '}
              {conhecidos === 1 ? 'sinal' : 'sinais'}.
            </p>
          </div>
        )}

        {ultimo && !duvida && (
          <div className="resultado__ultimo">
            <span>
              Último sinal: <strong>{nomeDe(ultimo.palpite.glosa)}</strong> ({Math.round(ultimo.palpite.confianca * 100)}% de
              certeza)
            </span>
            {!corrigindo && (
              <button type="button" className="ver__errou" onClick={() => setCorrigindo(true)}>
                Errou?
              </button>
            )}
            {corrigindo && seletor(corrigirUltimo)}
          </div>
        )}
        {aviso && <p className="comunidade__mensagem">{aviso}</p>}
      </div>

      <div className="acoes">
        <button type="button" onClick={() => falar(frase)} disabled={!frase}>
          🔊 Falar
        </button>
        <button type="button" onClick={() => mudarFrase((g) => g.slice(0, -1))} disabled={glosas.length === 0}>
          ⌫ Apagar sinal
        </button>
        <button type="button" onClick={() => mudarFrase(() => [])} disabled={glosas.length === 0}>
          Nova frase
        </button>
        <label className="alternador">
          <input type="checkbox" checked={vozLigada} onChange={(e) => setVozLigada(e.target.checked)} />
          Falar automaticamente
        </label>
      </div>
      <p className="nota">{conhecidos} sinais conhecidos neste celular. O vídeo não sai do aparelho.</p>

      <Diagnostico />
    </div>
  )
}

/** Painel para entender por que um sinal não foi reconhecido e mandar o relatório à equipe. */
function Diagnostico() {
  const [aberto, setAberto] = useState(false)
  const [lista, setLista] = useState<Tentativa[]>([])
  const [estado, setEstado] = useState('')
  const abrir = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const a = e.currentTarget.open
    setAberto(a)
    if (a) setLista(lerTentativas().slice(-10).reverse())
  }
  const enviar = async () => {
    setEstado('Enviando…')
    try {
      const r = await fetch(`${API_BASE}/api/sugestao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'erro',
          texto: relatorio(ehAndroid() ? 'android' : ehIOS() ? 'ios' : 'outro'),
          tela: 'ver-diagnostico',
        }),
      })
      const c = (await r.json().catch(() => ({}))) as { id?: string; erro?: string }
      setEstado(r.ok ? `Relatório enviado (protocolo ${c.id}). Obrigado!` : (c.erro ?? `Falha (${r.status}).`))
    } catch {
      setEstado('Sem conexão. Tente de novo mais tarde.')
    }
  }
  return (
    <details className="ver__diagnostico" onToggle={abrir}>
      <summary>Detalhes do reconhecimento</summary>
      {aberto && (
        <>
          <p className="nota">
            As últimas tentativas, com os sinais mais parecidos (quanto menor a distância, mais parecido). Só números: nada
            de imagem ou vídeo.
          </p>
          {lista.length === 0 && <p className="nota">Nenhuma tentativa ainda.</p>}
          <ol>
            {lista.map((t) => (
              <li key={t.em}>
                <strong>
                  {t.desfecho === 'aceito' || t.desfecho === 'juntado'
                    ? `Reconheceu ${nomeDe(t.palpites[0]?.glosa ?? '')}`
                    : t.desfecho === 'duvida'
                      ? 'Não teve certeza'
                      : t.desfecho === 'confirmado'
                        ? `Confirmado: ${nomeDe(t.certo ?? '')}`
                        : `Corrigido para ${nomeDe(t.certo ?? '')}`}
                </strong>{' '}
                · certeza {Math.round(t.confianca * 100)}% · {t.quadros} quadros · mão direita {Math.round(t.direita * 100)}%,
                esquerda {Math.round(t.esquerda * 100)}%
                <br />
                <small>{t.palpites.map((p) => `${nomeDe(p.glosa)} (${p.distancia})`).join(' · ') || 'sem comparação'}</small>
              </li>
            ))}
          </ol>
          <div className="ver__botoes">
            <button type="button" onClick={enviar} disabled={lista.length === 0}>
              Enviar relatório para a equipe
            </button>
            <button
              type="button"
              onClick={() => {
                limparTentativas()
                setLista([])
              }}
            >
              Limpar
            </button>
          </div>
          {estado && <p className="nota">{estado}</p>}
          <p className="nota">O relatório vira uma issue pública no GitHub do projeto, só com os números acima.</p>
        </>
      )}
    </details>
  )
}
