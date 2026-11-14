import { useEffect, useRef, useState } from 'react'
import type { Rota } from '../App'
import { Avatar } from '../components/Avatar'
import { SeletorMotor } from '../components/SeletorMotor'
import { suporta } from '../lib/plataforma'
import { aoFalharTraducao, sinalizar } from '../lib/vlibras'
import { escutar, falaSuportada } from '../lib/voz'
import { Ver } from './Ver'

type Sentido = 'pregacao' | 'libras'

/**
 * Modo culto, nos dois sentidos:
 *  - Pregação → Libras: escuta sem parar, legenda enorme e avatar no projetor/TV.
 *  - Libras → igreja: uma pessoa surda sinaliza para a câmera; o texto aparece grande e é falado no som.
 */
export function Culto({ ir }: { ir: (r: Rota, params?: Record<string, string>) => void }) {
  const [sentido, setSentido] = useState<Sentido>('pregacao')
  return (
    <div className="tela tela--culto">
      <div className="culto__sentidos" role="tablist" aria-label="Sentido da tradução">
        <button
          type="button"
          role="tab"
          aria-selected={sentido === 'pregacao'}
          className={sentido === 'pregacao' ? 'culto__sentido--ativo' : ''}
          onClick={() => setSentido('pregacao')}
        >
          🗣️ Pregação → Libras
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sentido === 'libras'}
          className={sentido === 'libras' ? 'culto__sentido--ativo' : ''}
          onClick={() => setSentido('libras')}
        >
          🤟 Libras → igreja
        </button>
      </div>
      {sentido === 'pregacao' ? <Pregacao /> : <LibrasParaIgreja ir={ir} />}
    </div>
  )
}

function LibrasParaIgreja({ ir }: { ir: (r: Rota, params?: Record<string, string>) => void }) {
  return (
    <>
      <p className="culto__instrucao">
        Aponte a câmera para a pessoa surda. Os sinais viram texto grande na tela e são falados — ligue o som do
        aparelho à mesa de som para a igreja ouvir.
      </p>
      <Ver ir={ir} grande />
    </>
  )
}

function Pregacao() {
  const [linhas, setLinhas] = useState<string[]>([])
  const [parcial, setParcial] = useState('')
  const [ativo, setAtivo] = useState(false)
  const [avatarLigado, setAvatarLigado] = useState(true)
  const [erro, setErro] = useState('')
  const [estado, setEstado] = useState('')
  const [telaCheia, setTelaCheia] = useState(false)
  const parar = useRef<() => void>(() => {})
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null)
  const avatarRef = useRef(avatarLigado)
  useEffect(() => {
    avatarRef.current = avatarLigado
  }, [avatarLigado])

  useEffect(() => () => parar.current(), [])
  useEffect(() => aoFalharTraducao(setErro), [])

  const pedirTelaAcesa = async () => {
    try {
      const nav = navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
      wakeLock.current = (await nav.wakeLock?.request('screen')) ?? null
    } catch {
      /* sem suporte: o usuário ajusta o tempo de tela */
    }
  }
  // o navegador solta a "tela acesa" quando o app sai da frente; pede de novo ao voltar
  useEffect(() => {
    if (!ativo) return
    const voltar = () => {
      if (document.visibilityState === 'visible') void pedirTelaAcesa()
    }
    document.addEventListener('visibilitychange', voltar)
    return () => document.removeEventListener('visibilitychange', voltar)
  }, [ativo])

  const iniciar = async () => {
    setErro('')
    setAtivo(true)
    // mantém a tela acesa durante o culto
    await pedirTelaAcesa()
    // iPhone não tem tela cheia para páginas: escondemos a barra do app e ocupamos a tela toda
    if (suporta.telaCheia()) document.documentElement.requestFullscreen().catch(() => setTelaCheia(true))
    else setTelaCheia(true)
    parar.current = escutar({
      continuo: true,
      aoParcial: setParcial,
      aoFinal: (t) => {
        setParcial('')
        setLinhas((l) => [...l.slice(-30), t])
        if (avatarRef.current) void sinalizar(t)
      },
      aoErro: setErro,
      aoEstado: setEstado,
      aoTerminar: () => setAtivo(false),
    })
  }

  const encerrar = () => {
    parar.current()
    setAtivo(false)
    wakeLock.current?.release().catch(() => {})
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setTelaCheia(false)
  }

  return (
    <div className={`culto ${telaCheia ? 'tela--culto-cheia' : ''} ${ativo ? 'culto--ativo' : ''}`}>
      {/* o botão principal fica no alto: no celular o avatar empurrava ele para fora da tela */}
      <div className="acoes culto__acoes">
        {ativo ? (
          <button type="button" className="botao-perigo" onClick={encerrar}>
            ■ Encerrar
          </button>
        ) : (
          <button type="button" className="botao-principal culto__iniciar" onClick={iniciar} disabled={!falaSuportada()}>
            ▶ Iniciar: ouvir a pregação
          </button>
        )}
        <label className="alternador">
          <input type="checkbox" checked={avatarLigado} onChange={(e) => setAvatarLigado(e.target.checked)} />
          Mostrar avatar
        </label>
      </div>

      {ativo && <p className="culto__ouvindo">● Ouvindo…</p>}
      {estado && <p className="culto__estado">{estado}</p>}
      {erro && <p className="erro">{erro}</p>}
      {!falaSuportada() && <p className="erro">Este navegador não grava áudio. Use o Chrome ou o Safari atualizados.</p>}

      <div className="culto__palco">
        <div className="culto__legenda" aria-live="polite">
          {linhas.slice(-2).map((l, i) => (
            <p key={linhas.length + i}>{l}</p>
          ))}
          {parcial && <p className="culto__parcial">{parcial}</p>}
          {!ativo && linhas.length === 0 && (
            <p className="culto__instrucao">
              Toque em Iniciar e permita o microfone. Deixe o microfone perto do pregador ou ligado à mesa de som; para
              todos verem, ligue o aparelho ao projetor ou à TV.
            </p>
          )}
        </div>
        {avatarLigado && (
          <div className="culto__avatar">
            <Avatar compacto />
          </div>
        )}
      </div>

      {!ativo && !suporta.telaAcesa() && (
        <p className="nota culto__dica">Dica: desative o bloqueio automático da tela durante o culto.</p>
      )}
      {!ativo && <SeletorMotor />}
    </div>
  )
}
