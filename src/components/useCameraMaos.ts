import { useEffect, useRef, useState } from 'react'
import { carregarDetector, desenharMaos, lerQuadro, type QuadroMaos } from '../lib/maos'

export type EstadoCamera = 'iniciando' | 'pronta' | 'erro'

/**
 * Liga a câmera e roda a detecção de mãos a cada quadro.
 * Em celulares fracos, processa no máximo ~15 quadros por segundo.
 */
export function useCameraMaos(aoQuadro: (q: QuadroMaos) => void, opcoes = { traseira: true, fpsMax: 15 }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [estado, setEstado] = useState<EstadoCamera>('iniciando')
  const [erro, setErro] = useState('')
  const [maosVisiveis, setMaosVisiveis] = useState(false)
  const [traseira, setTraseira] = useState(opcoes.traseira)
  const callback = useRef(aoQuadro)
  useEffect(() => {
    callback.current = aoQuadro
  })

  useEffect(() => {
    let parar = false
    let stream: MediaStream | null = null
    let raf = 0
    let ultimo = 0
    const intervalo = 1000 / opcoes.fpsMax

    ;(async () => {
      try {
        setEstado('iniciando')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: traseira ? 'environment' : 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        const detector = await carregarDetector()
        if (parar) return
        setEstado('pronta')

        const loop = () => {
          if (parar) return
          raf = requestAnimationFrame(loop)
          const agora = performance.now()
          if (agora - ultimo < intervalo || video.readyState < 2) return
          ultimo = agora
          const r = detector.detectForVideo(video, agora)
          const q = lerQuadro(r, agora)
          setMaosVisiveis(q.direita !== null || q.esquerda !== null)
          const canvas = canvasRef.current
          if (canvas) {
            if (canvas.width !== video.videoWidth) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
            }
            const ctx = canvas.getContext('2d')
            if (ctx) desenharMaos(ctx, q, canvas.width, canvas.height)
          }
          callback.current(q)
        }
        loop()
      } catch (e) {
        setEstado('erro')
        const nome = (e as Error).name
        setErro(
          nome === 'NotAllowedError'
            ? 'Permita o uso da câmera para o Sinalume reconhecer os sinais.'
            : nome === 'NotFoundError'
              ? 'Nenhuma câmera encontrada neste aparelho.'
              : 'Não foi possível iniciar a câmera ou o detector de mãos. Na primeira vez é preciso internet para baixar o modelo.',
        )
      }
    })()

    return () => {
      parar = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [traseira, opcoes.fpsMax])

  return { videoRef, canvasRef, estado, erro, maosVisiveis, traseira, alternarCamera: () => setTraseira((t) => !t) }
}
