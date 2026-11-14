import { useEffect, useState } from 'react'
import { suporta } from '../lib/plataforma'
import { aoProgressoModelo, modeloPronto, prepararModelo, type ProgressoModelo } from '../lib/transcricaoLocal'
import { definirMotor, motorEfetivo, motorPreferido, type Motor } from '../lib/voz'

/** Escolha do motor de transcrição + baixar o modelo do aparelho para usar sem internet. */
export function SeletorMotor() {
  const [motor, setMotor] = useState<Motor>(motorPreferido)
  const [progresso, setProgresso] = useState<ProgressoModelo>({ carregados: 0, total: 0, pronto: modeloPronto() })
  const [erro, setErro] = useState('')
  useEffect(() => aoProgressoModelo(setProgresso), [])

  const temNavegador = suporta.reconhecimentoNavegador()
  const baixando = !progresso.pronto && progresso.total > 0
  const pct = progresso.total ? Math.round((progresso.carregados / progresso.total) * 100) : 0

  return (
    <details className="motor">
      <summary>
        Transcrição: {motorEfetivo() === 'aparelho' ? 'no aparelho' : 'do navegador'}
        {baixando && ` · baixando ${pct}%`}
      </summary>
      <label className="motor__opcao">
        <input
          type="radio"
          name="motor"
          checked={motor === 'auto'}
          onChange={() => {
            setMotor('auto')
            definirMotor('auto')
          }}
        />
        <span>
          <strong>Automática</strong> — usa a do navegador{temNavegador ? '' : ' (indisponível aqui)'} e troca para a do
          aparelho sem internet
        </span>
      </label>
      <label className="motor__opcao">
        <input
          type="radio"
          name="motor"
          checked={motor === 'aparelho'}
          onChange={() => {
            setMotor('aparelho')
            definirMotor('aparelho')
          }}
        />
        <span>
          <strong>No aparelho</strong> — funciona sem internet e igual no iPhone e no Android. Baixa cerca de 80 MB na
          primeira vez; a legenda aparece ao terminar cada frase.
        </span>
      </label>
      {!progresso.pronto && (
        <button
          type="button"
          onClick={() => {
            setErro('')
            prepararModelo().catch((e: Error) => setErro(e.message))
          }}
          disabled={baixando}
        >
          {baixando ? `Baixando… ${pct}%` : '⬇ Baixar agora (use Wi-Fi)'}
        </button>
      )}
      {progresso.pronto && <p className="nota">✓ Transcrição no aparelho pronta para usar sem internet.</p>}
      {erro && <p className="erro">{erro}</p>}
    </details>
  )
}
