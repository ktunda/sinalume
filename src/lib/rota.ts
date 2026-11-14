/** Parâmetro da rota atual, ex.: #/ensinar?g=CÉLULA */
export function parametroRota(nome: string): string | null {
  const q = location.hash.split('?')[1]
  return q ? new URLSearchParams(q).get(nome) : null
}
