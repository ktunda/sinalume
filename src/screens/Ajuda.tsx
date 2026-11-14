import { Fragment, useEffect } from 'react'
import { CAPITULOS, MANUAL, VERSAO_MANUAL, type SecaoManual } from '../lib/manual'
import { parametroRota } from '../lib/rota'

const POR_ID = new Map(MANUAL.map((s) => [s.id, s]))
const PDF = 'https://github.com/ktunda/sinalume/raw/main/docs/Sinalume-Manual.pdf'

/** Destaca em negrito os nomes de botões e avisos que aparecem entre aspas, como no app. */
function Texto({ t }: { t: string }) {
  const partes = t.split(/("[^"]{1,40}")/g)
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith('"') && p.endsWith('"') && p.length > 2 ? <strong key={i}>“{p.slice(1, -1)}”</strong> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  )
}

function irPara(id: string, suave = true) {
  document.getElementById(id)?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' })
}

function Secao({ s }: { s: SecaoManual }) {
  return (
    <section id={`manual-${s.id}`} className="ajuda__secao">
      <h3>{s.titulo}</h3>
      <p className="ajuda__resumo">
        <Texto t={s.resumo} />
      </p>
      {s.passos && (
        <ol className="ajuda__passos">
          {s.passos.map((p) => (
            <li key={p}>
              <Texto t={p} />
            </li>
          ))}
        </ol>
      )}
      {s.dicas && (
        <div className="ajuda__dicas">
          <span>Dicas</span>
          <ul>
            {s.dicas.map((d) => (
              <li key={d}>
                <Texto t={d} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/** Manual do Sinalume dentro do app, no padrão da marca. #/ajuda?s=ouvir abre direto na seção. */
export function Ajuda() {
  useEffect(() => {
    const s = parametroRota('s')
    if (s) irPara(`manual-${s}`, false)
  }, [])

  return (
    <div className="tela tela--ajuda">
      <header className="ajuda__capa">
        <span className="ajuda__rotulo">Manual do usuário</span>
        <h2>Tudo o que o app faz, em poucos passos</h2>
        <p>Versão {VERSAO_MANUAL.split('-').reverse().join('/')} · toque num capítulo para ir direto a ele.</p>
      </header>

      <nav aria-label="Capítulos do manual">
        <ol className="ajuda__sumario" id="manual-sumario">
          {CAPITULOS.map((c, i) => (
            <li key={c.id}>
              <a
                href={`#/ajuda?s=${c.secoes[0]}`}
                onClick={(e) => {
                  e.preventDefault()
                  irPara(`capitulo-${c.id}`)
                }}
              >
                <span className="ajuda__num">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{c.titulo}</strong>
                  <small>{c.secoes.map((id) => POR_ID.get(id)?.titulo).join(' · ')}</small>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {CAPITULOS.map((c, i) => (
        <div key={c.id} className="ajuda__capitulo" id={`capitulo-${c.id}`}>
          <div className="ajuda__abertura">
            <span>Capítulo {String(i + 1).padStart(2, '0')}</span>
            <h2>{c.titulo}</h2>
            <p>{c.resumo}</p>
          </div>
          {c.secoes.map((id) => {
            const s = POR_ID.get(id)
            return s ? <Secao key={id} s={s} /> : null
          })}
          <button type="button" className="ajuda__voltar" onClick={() => irPara('manual-sumario')}>
            ↑ Voltar ao sumário
          </button>
        </div>
      ))}

      <a className="ajuda__pdf" href={PDF} target="_blank" rel="noreferrer">
        Baixar o manual em PDF
      </a>
    </div>
  )
}
