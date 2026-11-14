import type { RefObject } from 'react'
import type { EstadoCamera } from './useCameraMaos'

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  estado: EstadoCamera
  erro: string
  maosVisiveis: boolean
  espelhar: boolean
  capturando?: boolean
  aoAlternar: () => void
}

export function VisorCamera({ videoRef, canvasRef, estado, erro, maosVisiveis, espelhar, capturando, aoAlternar }: Props) {
  return (
    <div className={`visor ${espelhar ? 'visor--espelho' : ''} ${capturando ? 'visor--capturando' : ''}`}>
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} />
      {estado === 'iniciando' && <div className="visor__aviso">Abrindo a câmera e o detector de mãos…</div>}
      {estado === 'erro' && <div className="visor__aviso visor__aviso--erro">{erro}</div>}
      {estado === 'pronta' && (
        <div className={`visor__selo ${maosVisiveis ? 'visor__selo--ok' : ''}`}>
          {capturando ? '● Lendo sinal' : maosVisiveis ? 'Mãos detectadas' : 'Enquadre as mãos e o rosto'}
        </div>
      )}
      <button type="button" className="visor__trocar" onClick={aoAlternar} aria-label="Trocar câmera">
        ⇄
      </button>
    </div>
  )
}
