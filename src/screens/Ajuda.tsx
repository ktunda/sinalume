import { useEffect } from 'react'
import { MANUAL, VERSAO_MANUAL } from '../lib/manual'
import { parametroRota } from '../lib/rota'

/** Manual do Sinalume dentro do app. #/ajuda?s=ouvir abre direto na seção. */
export function Ajuda() {
  useEffect(() => {
    const s = parametroRota('s')
    if (s) document.getElementById(`manual-${s}`)?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <div className="tela tela--sobre tela--ajuda">
      <p className="nota">Versão {VERSAO_MANUAL.split('-').reverse().join('/')}</p>
      <nav aria-label="Seções do manual">
        <ul className="ajuda__indice">
          {MANUAL.map((s) => (
            <li key={s.id}>
              <a
                href={`#/ajuda?s=${s.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(`manual-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {s.titulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {MANUAL.map((s) => (
        <section key={s.id} id={`manual-${s.id}`} className="ajuda__secao">
          <h2>{s.titulo}</h2>
          <p>{s.resumo}</p>
          {s.passos && (
            <ol>
              {s.passos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          )}
          {s.dicas && (
            <div className="ajuda__dicas">
              <strong>Dicas</strong>
              <ul>
                {s.dicas.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
