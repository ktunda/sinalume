import { lazy, Suspense, useEffect, useState } from 'react'
import { InstalarApp } from './components/InstalarApp'

// cada tela é baixada só quando aberta: a tela inicial abre mais rápido em celular simples
const Culto = lazy(() => import('./screens/Culto').then((m) => ({ default: m.Culto })))
const Ensinar = lazy(() => import('./screens/Ensinar').then((m) => ({ default: m.Ensinar })))
const Ouvir = lazy(() => import('./screens/Ouvir').then((m) => ({ default: m.Ouvir })))
const Sinais = lazy(() => import('./screens/Sinais').then((m) => ({ default: m.Sinais })))
const Sobre = lazy(() => import('./screens/Sobre').then((m) => ({ default: m.Sobre })))
const Sugestoes = lazy(() => import('./screens/Sugestoes').then((m) => ({ default: m.Sugestoes })))
const Termo = lazy(() => import('./screens/Termo').then((m) => ({ default: m.Termo })))
const Ver = lazy(() => import('./screens/Ver').then((m) => ({ default: m.Ver })))
const Ajuda = lazy(() => import('./screens/Ajuda').then((m) => ({ default: m.Ajuda })))

export type Rota = 'inicio' | 'ouvir' | 'ver' | 'culto' | 'ensinar' | 'sinais' | 'sugestoes' | 'termo' | 'sobre' | 'ajuda'

const TITULOS: Record<Rota, string> = {
  inicio: 'Sinalume',
  ouvir: 'Ouvinte fala → Libras',
  ver: 'Surdo sinaliza → voz',
  culto: 'Modo culto',
  ensinar: 'Ensinar sinais',
  sinais: 'Sinais',
  sugestoes: 'Sugestões',
  termo: 'Termo de consentimento',
  sobre: 'Sobre o Sinalume',
  ajuda: 'Manual',
}

// seção do manual que explica cada tela (o manual em si não importa nada pesado)
const SECAO_DA_ROTA: Partial<Record<Rota, string>> = {
  ver: 'ver', ouvir: 'ouvir', culto: 'culto', ensinar: 'ensinar', sinais: 'sinais',
  sugestoes: 'sugestoes', termo: 'termo', sobre: 'sobre',
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
          <img src="./sinalume-logo-branco.svg" alt="Sinalume" className="topo__logo" width={150} height={40} />
        ) : (
          <>
            <button type="button" className="topo__voltar" onClick={() => ir('inicio')} aria-label="Voltar ao início">
              ←
            </button>
            <h1>{TITULOS[rota]}</h1>
            {rota !== 'ajuda' && (
              <button
                type="button"
                className="topo__ajuda"
                onClick={() => ir('ajuda', { s: SECAO_DA_ROTA[rota] ?? 'comecar' })}
                aria-label={`Ajuda: ${TITULOS[rota]}`}
              >
                ?
              </button>
            )}
          </>
        )}
      </header>
      <main>
        <Suspense fallback={<p className="carregando-tela">Carregando…</p>}>
        {rota === 'inicio' && <Inicio ir={ir} />}
        {rota === 'ouvir' && <Ouvir />}
        {rota === 'ver' && <Ver ir={ir} />}
        {rota === 'culto' && <Culto ir={ir} />}
        {rota === 'ensinar' && <Ensinar key={location.hash} />}
        {rota === 'sinais' && <Sinais ir={ir} />}
        {rota === 'sugestoes' && <Sugestoes />}
        {rota === 'termo' && <Termo />}
        {rota === 'sobre' && <Sobre />}
        {rota === 'ajuda' && <Ajuda key={location.hash} />}
        </Suspense>
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
      <InstalarApp />
      <div className="inicio__secundarios">
        <button type="button" onClick={() => ir('ensinar')}>✋ Ensinar sinais</button>
        <button type="button" onClick={() => ir('sinais')}>📋 Sinais que temos</button>
        <button type="button" onClick={() => ir('sugestoes')}>💡 Sugestões</button>
        <button type="button" onClick={() => ir('ajuda')}>📖 Manual</button>
        <button type="button" onClick={() => ir('sobre')}>ℹ️ Sobre e privacidade</button>
      </div>
    </div>
  )
}
