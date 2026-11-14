import { useEffect, useRef, useState } from 'react'
import {
  aoMudarEstado,
  definirVelocidade,
  desmontarAvatar,
  montarAvatar,
  repetir,
  type EstadoAvatar,
  type Velocidade,
} from '../lib/vlibras'

const VELOCIDADES: Velocidade[] = [0.5, 1.0, 1.5, 2.0]

export function Avatar({ compacto = false }: { compacto?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState<EstadoAvatar>('carregando')
  const [velocidade, setVel] = useState<Velocidade>(1.0)

  useEffect(() => {
    const parar = aoMudarEstado(setEstado)
    const el = ref.current
    if (el) montarAvatar(el)
    return () => {
      parar()
      if (el) desmontarAvatar(el)
    }
  }, [])

  const trocarVelocidade = () => {
    const prox = VELOCIDADES[(VELOCIDADES.indexOf(velocidade) + 1) % VELOCIDADES.length]
    setVel(prox)
    definirVelocidade(prox)
  }

  return (
    <div className={`avatar ${compacto ? 'avatar--compacto' : ''}`}>
      <div ref={ref} className="avatar__palco" aria-label="Avatar sinalizando em Libras" />
      {estado === 'carregando' && (
        <div className="avatar__aviso avatar__aviso--cobre">
          <span className="girando" aria-hidden />
          Carregando avatar de Libras…
          <small>Na primeira vez baixa cerca de 14 MB</small>
        </div>
      )}
      {estado === 'erro' && (
        <div className="avatar__aviso">Não foi possível carregar o avatar. A legenda continua funcionando.</div>
      )}
      <div className="avatar__controles">
        <button type="button" onClick={repetir} aria-label="Repetir sinalização">
          ↺ Repetir
        </button>
        <button type="button" onClick={trocarVelocidade} aria-label="Mudar velocidade do avatar">
          Velocidade {velocidade.toString().replace('.', ',')}×
        </button>
      </div>
    </div>
  )
}
