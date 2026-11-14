// Codificação compacta dos exemplos de sinais para envio e para o acervo da comunidade.
// Cada exemplo tem 32 quadros x 132 valores. Em JSON puro seriam ~25 KB; em int8 + base64 ficam ~5,6 KB.
// btoa/atob existem no navegador e no Node 16+.
// Precisão: passo de 1/32 (0,03) — muito abaixo da variação natural entre duas execuções do mesmo sinal.

export const ESCALA = 32
export const QUADROS = 32
export const DIM_CODEC = 132
const BYTES = QUADROS * DIM_CODEC

function paraBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

function deBase64(b64: string): Uint8Array {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

/** quadros (32 x 132) -> texto base64 de int8 */
export function codificar(quadros: number[][]): string {
  const i8 = new Int8Array(BYTES)
  for (let t = 0; t < QUADROS; t++) {
    for (let k = 0; k < DIM_CODEC; k++) {
      const v = Math.round((quadros[t]?.[k] ?? 0) * ESCALA)
      i8[t * DIM_CODEC + k] = Math.max(-127, Math.min(127, v))
    }
  }
  return paraBase64(new Uint8Array(i8.buffer))
}

/** texto base64 -> quadros (32 x 132). Lança erro se o tamanho não bater. */
export function decodificar(b64: string): number[][] {
  const bytes = deBase64(b64)
  if (bytes.length !== BYTES) throw new Error(`exemplo com ${bytes.length} bytes; esperado ${BYTES}`)
  const i8 = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length)
  const quadros: number[][] = []
  for (let t = 0; t < QUADROS; t++) {
    const linha = new Array<number>(DIM_CODEC)
    for (let k = 0; k < DIM_CODEC; k++) linha[k] = i8[t * DIM_CODEC + k] / ESCALA
    quadros.push(linha)
  }
  return quadros
}
