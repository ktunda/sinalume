import { TERMO, VERSAO_TERMO } from '../lib/termo'

export function Termo() {
  return (
    <div className="tela tela--sobre">
      <p>
        <strong>Termo de consentimento para doação de gravações de sinais</strong>
        <br />
        <span className="nota">Versão {VERSAO_TERMO.split('-').reverse().join('/')}</span>
      </p>
      {TERMO.map((s) => (
        <section key={s.titulo}>
          <h2>{s.titulo}</h2>
          {s.paragrafos.map((p) => (
            <p key={p.slice(0, 30)}>{p}</p>
          ))}
        </section>
      ))}
    </div>
  )
}
