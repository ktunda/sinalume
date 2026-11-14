import { useEffect, useState } from 'react'
import { Culto } from './screens/Culto'
import { Ensinar } from './screens/Ensinar'
import { Ouvir } from './screens/Ouvir'
import { Sinais } from './screens/Sinais'
import { Sobre } from './screens/Sobre'
import { Sugestoes } from './screens/Sugestoes'
import { Termo } from './screens/Termo'
import { Ver } from './screens/Ver'

export type Rota = 'inicio' | 'ouvir' | 'ver' | 'culto' | 'ensinar' | 'sinais' | 'sugestoes' | 'termo' | 'sobre'

const TITULOS: Record<Rota, string> = {
  inicio: 'Sinalume',
  ouvir: 'Ouvinte fala → Libras',
  ver: 'Surdo sinaliza → voz',
  culto: 'Modo culto',
  ensinar: 'Ensinar sinais',
  sinais: 'Sinais: o que temos e o que falta',
  sugestoes: 'Sugestões',
  termo: 'Termo de consentimento',
  sobre: 'Sobre o Sinalume',
}

const lerRota = (): Rota => {
  const r = location.hash.replace('#/', '').split('?')[0] as Rota
  return r in TITULOS ? r : 'inicio'
}

export default function App() {
  const [rota, setRota] = useState<Rota>(lerRota)
  useEffect(() => {
    const f = () => setRota(lerRota())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const ir = (r: Rota, params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : ''
    location.hash = r === 'inicio' ? '' : `#/${r}${q}`
  }

  return (
    <div className={`app app--${rota}`}>
      <header className="topo">
        {rota === 'inicio' ? (
          <img src="./sinalume-logo-branco.svg" alt="Sinalume" className="topo__logo" />
        ) : (
          <>
            <button type="button" className="topo__voltar" onClick={() => ir('inicio')} aria-label="Voltar ao início">
              ←
            </button>
            <h1>{TITULOS[rota]}</h1>
          </>
        )}
      </header>
      <main>
        {rota === 'inicio' && <Inicio ir={ir} />}
        {rota === 'ouvir' && <Ouvir />}
        {rota === 'ver' && <Ver ir={ir} />}
        {rota === 'culto' && <Culto />}
        {rota === 'ensinar' && <Ensinar key={location.hash} />}
        {rota === 'sinais' && <Sinais ir={ir} />}
        {rota === 'sugestoes' && <Sugestoes />}
        {rota === 'termo' && <Termo />}
        {rota === 'sobre' && <Sobre />}
      </main>
    </div>
  )
}

function Inicio({ ir }: { ir: (r: Rota, params?: Record<string, string>) => void }) {
  return (
    <div className="tela tela--inicio">
      <p className="inicio__chamada">Conversa entre surdos e ouvintes, de graça e no seu celular.</p>
      <button type="button" className="cartao cartao--ver" onClick={() => ir('ver')}>
        <span className="cartao__icone" aria-hidden>🤟</span>
        <span>
          <strong>Surdo sinaliza</strong>
          <small>Aponte a câmera: os sinais viram texto e voz</small>
        </span>
      </button>
      <button type="button" className="cartao cartao--ouvir" onClick={() => ir('ouvir')}>
        <span className="cartao__icone" aria-hidden>🗣️</span>
        <span>
          <strong>Ouvinte fala</strong>
          <small>A fala vira legenda e Libras no avatar</small>
        </span>
      </button>
      <button type="button" className="cartao cartao--culto" onClick={() => ir('culto')}>
        <span className="cartao__icone" aria-hidden>⛪</span>
        <span>
          <strong>Modo culto</strong>
          <small>Legenda grande e Libras no projetor</small>
        </span>
      </button>
      <div className="inicio__secundarios">
        <button type="button" onClick={() => ir('ensinar')}>✋ Ensinar sinais</button>
        <button type="button" onClick={() => ir('sinais')}>📋 Sinais que temos</button>
        <button type="button" onClick={() => ir('sugestoes')}>💡 Sugestões</button>
        <button type="button" onClick={() => ir('sobre')}>ℹ️ Sobre e privacidade</button>
      </div>
    </div>
  )
}
