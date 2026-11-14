// Detecção de mãos no próprio celular com MediaPipe (código aberto, Apache-2.0).
// O vídeo nunca sai do aparelho: só usamos as coordenadas dos 21 pontos de cada mão.
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision'

const MODELO_MAOS =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

let detector: HandLandmarker | null = null
let carregando: Promise<HandLandmarker> | null = null

export async function carregarDetector(): Promise<HandLandmarker> {
  if (detector) return detector
  if (carregando) return carregando
  carregando = (async () => {
    const arquivos = await FilesetResolver.forVisionTasks('./mediapipe/wasm')
    const opcoes = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: MODELO_MAOS, delegate },
      runningMode: 'VIDEO' as const,
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })
    try {
      detector = await HandLandmarker.createFromOptions(arquivos, opcoes('GPU'))
    } catch {
      // celulares sem WebGL adequado: CPU é mais lento, mas funciona
      detector = await HandLandmarker.createFromOptions(arquivos, opcoes('CPU'))
    }
    return detector
  })()
  return carregando
}

export interface Ponto {
  x: number
  y: number
  z: number
}

export interface QuadroMaos {
  /** mão dominante ou única (ordem: Right, Left como o MediaPipe as nomeia na imagem espelhada) */
  direita: Ponto[] | null
  esquerda: Ponto[] | null
  t: number
}

export function lerQuadro(r: HandLandmarkerResult, t: number): QuadroMaos {
  const q: QuadroMaos = { direita: null, esquerda: null, t }
  r.landmarks.forEach((pontos, i) => {
    const lado = r.handedness[i]?.[0]?.categoryName
    if (lado === 'Left') q.esquerda = pontos
    else q.direita = pontos
  })
  return q
}

/** Tamanho do vetor de características por quadro (2 mãos x (21 pontos x 3 + posição 2 + presença 1)). */
export const DIM = 2 * (21 * 3 + 3)

function caracteristicasMao(p: Ponto[] | null, saida: number[]) {
  if (!p) {
    for (let i = 0; i < 21 * 3 + 3; i++) saida.push(0)
    return
  }
  const pulso = p[0]
  // escala: distância pulso -> base do dedo médio (ponto 9). Torna o sinal independente da distância da câmera
  const escala = Math.hypot(p[9].x - pulso.x, p[9].y - pulso.y, p[9].z - pulso.z) || 1
  for (const pt of p) {
    saida.push((pt.x - pulso.x) / escala, (pt.y - pulso.y) / escala, (pt.z - pulso.z) / escala)
  }
  // posição da mão na imagem (onde o sinal é feito importa em Libras)
  saida.push((pulso.x - 0.5) * 2, (pulso.y - 0.5) * 2, 1)
}

/** Converte um quadro em vetor numérico. Mesma função do script de treino (training/caracteristicas.py). */
export function vetorizar(q: QuadroMaos): number[] {
  const v: number[] = []
  caracteristicasMao(q.direita, v)
  caracteristicasMao(q.esquerda, v)
  return v
}

/** Desenha os pontos das mãos sobre o vídeo, para o usuário ver que está sendo detectado. */
export function desenharMaos(ctx: CanvasRenderingContext2D, q: QuadroMaos, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const LIGACOES = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11],
    [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
  ]
  for (const [pontos, cor] of [
    [q.direita, '#F4A51C'],
    [q.esquerda, '#7FB2FF'],
  ] as const) {
    if (!pontos) continue
    ctx.strokeStyle = cor
    ctx.fillStyle = cor
    ctx.lineWidth = 3
    for (const [a, b] of LIGACOES) {
      ctx.beginPath()
      ctx.moveTo(pontos[a].x * w, pontos[a].y * h)
      ctx.lineTo(pontos[b].x * w, pontos[b].y * h)
      ctx.stroke()
    }
    for (const p of pontos) {
      ctx.beginPath()
      ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
