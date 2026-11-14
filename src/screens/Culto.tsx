import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../components/Avatar'
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
    document.documentElement.requestFullscreen?.().catch(() => {})
    parar.current = escutar({
      continuo: true,
      aoParcial: setParcial,
      aoFinal: (t) => {
        setParcial('')
        setLinhas((l) => [...l.slice(-30), t])
        if (avatarLigado) sinalizar(t)
      },
      aoErro: setErro,
      aoTerminar: () => setAtivo(false),
    })
  }

  const encerrar = () => {
    parar.current()
    setAtivo(false)
    wakeLock.current?.release().catch(() => {})
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  return (
    <div className="tela tela--culto">
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

      {erro && <p className="erro">{erro}</p>}
      {!falaSuportada() && <p className="erro">Use o Chrome no Android ou no computador para o modo culto.</p>}

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
    </div>
  )
}
