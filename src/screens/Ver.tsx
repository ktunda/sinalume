import { useEffect, useMemo, useRef, useState } from 'react'
import { useCameraMaos } from '../components/useCameraMaos'
import { VisorCamera } from '../components/VisorCamera'
import { carregarExemplos } from '../lib/acervo'
import { baixarAcervo } from '../lib/comunidade'
import { glosasParaFrase } from '../lib/frase'
import { ClassificadorDTW, Segmentador, type Palpite } from '../lib/reconhecedor'
import { VOCAB_POR_GLOSA } from '../lib/vocab'
import { falar } from '../lib/voz'
import type { Rota } from '../App'

const CONFIANCA_MINIMA = 0.35
const PAUSA_FIM_FRASE_MS = 2500

/** Fluxo 1: o ouvinte aponta a câmera para o surdo; os sinais viram texto e voz. */
export function Ver({ ir, grande = false }: { ir: (r: Rota) => void; grande?: boolean }) {
  const [classificador, setClassificador] = useState<ClassificadorDTW | null>(null)
  const [glosas, setGlosas] = useState<string[]>([])
  const [ultimo, setUltimo] = useState<Palpite | null>(null)
  const [duvida, setDuvida] = useState(false)
  const [capturando, setCapturando] = useState(false)
  const [vozLigada, setVozLigada] = useState(true)
  const timerFrase = useRef<number | undefined>(undefined)

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

  const segmentador = useMemo(
    () =>
      new Segmentador((seq) => {
        if (!classificador || classificador.glosasConhecidas.length === 0) return
        const p = classificador.classificar(seq)
        setUltimo(p)
        if (!p || p.confianca < CONFIANCA_MINIMA) {
          setDuvida(true)
          return
        }
        setDuvida(false)
        setGlosas((g) => {
          const novas = [...g, p.glosa]
          // sem novo sinal por um tempo: a frase acabou, fala em voz alta
          window.clearTimeout(timerFrase.current)
          timerFrase.current = window.setTimeout(() => {
            if (vozLigada) falar(glosasParaFrase(novas))
          }, PAUSA_FIM_FRASE_MS)
          return novas
        })
      }),
    [classificador, vozLigada],
  )

  const cam = useCameraMaos((q) => {
    segmentador.alimentar(q)
    if (segmentador.capturando !== capturando) setCapturando(segmentador.capturando)
  })

  const conhecidos = classificador?.glosasConhecidas.length ?? 0

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
            <p>Não reconheci esse sinal. Pode repetir mais devagar?</p>
            <p className="nota">
              Este celular conhece {conhecidos} {conhecidos === 1 ? 'sinal' : 'sinais'}:{' '}
              {classificador?.glosasConhecidas
                .slice(0, 12)
                .map((g) => VOCAB_POR_GLOSA.get(g)?.texto ?? g.toLowerCase().replace(/-/g, ' '))
                .join(', ')}
              {conhecidos > 12 ? '…' : '.'} Se for outro, ensine o app.
            </p>
            <button type="button" onClick={() => ir('ensinar')}>
              Gravar um sinal novo
            </button>
          </div>
        )}
        {ultimo && !duvida && (
          <p className="resultado__ultimo">
            Último sinal: <strong>{VOCAB_POR_GLOSA.get(ultimo.glosa)?.texto ?? ultimo.glosa}</strong> (
            {Math.round(ultimo.confianca * 100)}% de certeza)
          </p>
        )}
      </div>

      <div className="acoes">
        <button type="button" onClick={() => falar(frase)} disabled={!frase}>
          🔊 Falar
        </button>
        <button
          type="button"
          onClick={() => mudarFrase((g) => g.slice(0, -1))}
          disabled={glosas.length === 0}
        >
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
    </div>
  )
}
