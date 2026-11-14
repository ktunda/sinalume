import { lazy, Suspense, useEffect, useState } from 'react'
import { Icone, type NomeIcone } from './components/Icone'
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
  const principais: { rota: Rota; icone: NomeIcone; titulo: string; texto: string }[] = [
    { rota: 'ver', icone: 'maos', titulo: 'Surdo sinaliza', texto: 'Aponte a câmera: os sinais viram texto e voz' },
    { rota: 'ouvir', icone: 'fala', titulo: 'Ouvinte fala', texto: 'A fala vira legenda e Libras no avatar' },
    { rota: 'culto', icone: 'igreja', titulo: 'Modo culto', texto: 'Pregação em Libras no telão, nos dois sentidos' },
  ]
  const outros: { rota: Rota; icone: NomeIcone; titulo: string }[] = [
    { rota: 'ensinar', icone: 'gravar', titulo: 'Ensinar sinais' },
    { rota: 'sinais', icone: 'lista', titulo: 'Sinais que temos' },
    { rota: 'sugestoes', icone: 'ideia', titulo: 'Sugestões' },
    { rota: 'ajuda', icone: 'livro', titulo: 'Manual' },
    { rota: 'sobre', icone: 'escudo', titulo: 'Sobre e privacidade' },
  ]
  return (
    <div className="tela tela--inicio">
      <p className="inicio__chamada">Conversa entre surdos e ouvintes, de graça e no seu celular.</p>
      {principais.map((c) => (
        <button key={c.rota} type="button" className={`cartao cartao--${c.rota}`} onClick={() => ir(c.rota)}>
          <span className="cartao__icone">
            <Icone nome={c.icone} tamanho={30} />
          </span>
          <span className="cartao__texto">
            <strong>{c.titulo}</strong>
            <small>{c.texto}</small>
          </span>
          <Icone nome="seta" className="cartao__seta" />
        </button>
      ))}
      <InstalarApp />
      <nav className="inicio__outros" aria-label="Mais opções">
        {outros.map((o) => (
          <button key={o.rota} type="button" onClick={() => ir(o.rota)}>
            <Icone nome={o.icone} />
            <span>{o.titulo}</span>
            <Icone nome="seta" className="inicio__seta" />
          </button>
        ))}
      </nav>
    </div>
  )
}
