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
export function Ver({ ir }: { ir: (r: Rota) => void }) {
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
  }, [])
  const baixar = async () => {
    setBaixando(true)
    setErroAcervo('')
    try {
      await baixarAcervo()
      await recarregar()
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
        if (!classificador) return
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
    <div className="tela tela--ver">
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
          <p>O Sinalume ainda não conhece nenhum sinal neste celular. Baixe os sinais da comunidade ou grave os seus.</p>
          <button type="button" className="botao-principal" onClick={baixar} disabled={baixando}>
            {baixando ? 'Baixando…' : '⬇ Baixar sinais da comunidade'}
          </button>
          {erroAcervo && <p className="erro">{erroAcervo}</p>}
          <button type="button" onClick={() => ir('ensinar')}>
            Gravar meus sinais
          </button>
        </div>
      )}

      <div className="resultado" aria-live="polite">
        <p className={`resultado__frase ${frase ? '' : 'resultado__frase--vazia'}`}>{frase || 'Os sinais reconhecidos viram frase aqui.'}</p>
        {duvida && <p className="resultado__duvida">Não entendi esse sinal. Pode repetir?</p>}
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
          onClick={() => setGlosas((g) => g.slice(0, -1))}
          disabled={glosas.length === 0}
        >
          ⌫ Apagar sinal
        </button>
        <button type="button" onClick={() => setGlosas([])} disabled={glosas.length === 0}>
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
