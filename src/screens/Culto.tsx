import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { SeletorMotor } from '../components/SeletorMotor'
import { suporta } from '../lib/plataforma'
import { sinalizar } from '../lib/vlibras'
import { escutar, falaSuportada } from '../lib/voz'

/**
 * Modo culto: o celular ou notebook fica ligado ao projetor/TV.
 * Escuta a pregação sem parar, mostra legenda grande e o avatar sinaliza.
 */
export function Culto() {
  const [linhas, setLinhas] = useState<string[]>([])
  const [parcial, setParcial] = useState('')
  const [ativo, setAtivo] = useState(false)
  const [avatarLigado, setAvatarLigado] = useState(true)
  const [erro, setErro] = useState('')
  const [estado, setEstado] = useState('')
  const [telaCheia, setTelaCheia] = useState(false)
  const parar = useRef<() => void>(() => {})
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null)

  useEffect(() => () => parar.current(), [])

  const iniciar = async () => {
    setErro('')
    setAtivo(true)
    // mantém a tela acesa durante o culto
    try {
      const nav = navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
      wakeLock.current = (await nav.wakeLock?.request('screen')) ?? null
    } catch {
      /* sem suporte: o usuário ajusta o tempo de tela */
    }
    // iPhone não tem tela cheia para páginas: escondemos a barra do app e ocupamos a tela toda
    if (suporta.telaCheia()) document.documentElement.requestFullscreen().catch(() => setTelaCheia(true))
    else setTelaCheia(true)
    parar.current = escutar({
      continuo: true,
      aoParcial: setParcial,
      aoFinal: (t) => {
        setParcial('')
        setLinhas((l) => [...l.slice(-30), t])
        if (avatarLigado) sinalizar(t)
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
    <div className={`tela tela--culto ${telaCheia ? 'tela--culto-cheia' : ''}`}>
      <div className="culto__palco">
        <div className="culto__legenda" aria-live="polite">
          {linhas.slice(-2).map((l, i) => (
            <p key={linhas.length + i}>{l}</p>
          ))}
          {parcial && <p className="culto__parcial">{parcial}</p>}
          {!ativo && linhas.length === 0 && (
            <p className="culto__instrucao">
              Ligue este aparelho ao projetor ou à TV e deixe o microfone perto do pregador ou ligado à mesa de som.
            </p>
          )}
        </div>
        {avatarLigado && (
          <div className="culto__avatar">
            <Avatar compacto />
          </div>
        )}
      </div>

      {estado && <p className="culto__estado">{estado}</p>}
      {erro && <p className="erro">{erro}</p>}
      {!falaSuportada() && <p className="erro">Este navegador não grava áudio. Use o Chrome ou o Safari atualizados.</p>}
      {!ativo && !suporta.telaAcesa() && (
        <p className="nota culto__dica">Dica: desative o bloqueio automático da tela durante o culto.</p>
      )}

      <div className="acoes">
        {ativo ? (
          <button type="button" className="botao-perigo" onClick={encerrar}>
            ■ Encerrar
          </button>
        ) : (
          <button type="button" className="botao-principal" onClick={iniciar} disabled={!falaSuportada()}>
            ▶ Iniciar legenda e Libras
          </button>
        )}
        <label className="alternador">
          <input type="checkbox" checked={avatarLigado} onChange={(e) => setAvatarLigado(e.target.checked)} />
          Mostrar avatar
        </label>
      </div>
      {!ativo && <SeletorMotor />}
    </div>
  )
}
