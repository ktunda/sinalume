import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { SeletorMotor } from '../components/SeletorMotor'
import { aoFalharTraducao, sinalizar } from '../lib/vlibras'
import { escutar, falaSuportada } from '../lib/voz'

/** Fluxo 2: o ouvinte fala (ou digita) e o surdo vê a legenda e o avatar em Libras. */
export function Ouvir() {
  const [parcial, setParcial] = useState('')
  const [frases, setFrases] = useState<string[]>([])
  const [ouvindo, setOuvindo] = useState(false)
  const [erro, setErro] = useState('')
  const [digitado, setDigitado] = useState('')
  const [estado, setEstado] = useState('')
  const parar = useRef<() => void>(() => {})
  useEffect(() => aoFalharTraducao(setErro), [])
  // ao sair da tela, desliga o microfone
  useEffect(() => () => parar.current(), [])

  const enviar = (texto: string) => {
    setErro('')
    setFrases((f) => [...f.slice(-20), texto])
    sinalizar(texto)
  }

  const comecar = () => {
    setErro('')
    setOuvindo(true)
    parar.current = escutar({
      continuo: false,
      aoParcial: setParcial,
      aoFinal: (t) => {
        setParcial('')
        enviar(t)
      },
      aoErro: setErro,
      aoEstado: setEstado,
      aoTerminar: () => setOuvindo(false),
    })
  }
  const terminar = () => {
    parar.current()
    setOuvindo(false)
  }

  return (
    <div className="tela tela--ouvir">
      <Avatar />

      <div className="legenda" aria-live="polite">
        {frases.length === 0 && !parcial && <p className="legenda__vazia">A fala aparece aqui, em texto grande.</p>}
        {frases.slice(-3).map((f, i, arr) => (
          <p key={frases.length - arr.length + i} className={i === arr.length - 1 ? 'legenda__atual' : ''}>
            {f}
          </p>
        ))}
        {parcial && <p className="legenda__parcial">{parcial}</p>}
      </div>

      {estado && <p className="nota">{estado}</p>}
      {erro && <p className="erro">{erro}</p>}

      {falaSuportada() && (
        <button
          type="button"
          className={`botao-falar ${ouvindo ? 'botao-falar--ativo' : ''}`}
          onPointerDown={comecar}
          onPointerUp={terminar}
          onPointerLeave={() => ouvindo && terminar()}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            // teclado e leitores de tela: segure Espaço ou Enter para falar
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !ouvindo) {
              e.preventDefault()
              comecar()
            }
          }}
          onKeyUp={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && ouvindo) {
              e.preventDefault()
              terminar()
            }
          }}
          aria-pressed={ouvindo}
        >
          {ouvindo ? '🎤 Ouvindo… solte para enviar' : '🎤 Segure para falar'}
        </button>
      )}

      <SeletorMotor />

      <form
        className="digitar"
        onSubmit={(e) => {
          e.preventDefault()
          if (digitado.trim()) enviar(digitado.trim())
          setDigitado('')
        }}
      >
        <input
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          placeholder="Ou digite aqui…"
          aria-label="Texto para traduzir para Libras"
        />
        <button type="submit">Sinalizar</button>
      </form>
    </div>
  )
}
