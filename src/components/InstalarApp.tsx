import { useEffect, useState } from 'react'
import { ehIOS, instalado } from '../lib/plataforma'

interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const CHAVE = 'sinalume:instalar-dispensado'

/**
 * Convite para instalar o app na tela inicial.
 * Android/Chrome: botão que abre a instalação. iPhone/iPad: passo a passo do Safari (a Apple não tem botão automático).
 */
export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null)
  const [dispensado, setDispensado] = useState(() => {
    try {
      return localStorage.getItem(CHAVE) === '1'
    } catch {
      return false
    }
  })
  const ios = ehIOS()

  useEffect(() => {
    const f = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalar)
    }
    window.addEventListener('beforeinstallprompt', f)
    return () => window.removeEventListener('beforeinstallprompt', f)
  }, [])

  if (instalado() || dispensado || (!ios && !evento)) return null

  const dispensar = () => {
    setDispensado(true)
    try {
      localStorage.setItem(CHAVE, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="instalar" role="region" aria-label="Instalar o Sinalume">
      <img src="./icons/sinalume-icone-192.png" alt="" width={48} height={48} />
      <div>
        <strong>Instale o Sinalume no seu celular</strong>
        {ios ? (
          <p>
            No Safari, toque em <span aria-label="Compartilhar">Compartilhar ⬆︎</span> e depois em{' '}
            <strong>Adicionar à Tela de Início</strong>. Abre mais rápido e funciona sem internet.
          </p>
        ) : (
          <p>Abre mais rápido, ocupa pouco espaço e funciona sem internet.</p>
        )}
        <div className="instalar__acoes">
          {evento && (
            <button
              type="button"
              className="botao-principal"
              onClick={async () => {
                await evento.prompt()
                setEvento(null)
              }}
            >
              Instalar
            </button>
          )}
          <button type="button" onClick={dispensar}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
