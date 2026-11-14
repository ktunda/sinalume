// Ícones de traço do Sinalume (padrão do Manual da Marca): 24×24, traço 2, cantos redondos, cor do texto.
const CAMINHOS = {
  maos: 'M7 11V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.3 15.5a1.6 1.6 0 0 1 2.5-2L7 15',
  fala: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm7 9a7 7 0 0 1-14 0m7 7v3m-4 0h8',
  igreja: 'M12 2v4m-2-2h4M5 22V12l7-5 7 5v10M9 22v-5a3 3 0 0 1 6 0v5M3 22h18',
  gravar: 'M15 10l5-3v10l-5-3M4 6h11v12H4z',
  lista: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  ideia: 'M9 18h6m-5 3h4m-2-18a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z',
  livro: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 16a2 2 0 0 1 2-2h13v2H6',
  escudo: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Zm-3 9 2 2 4-4',
  seta: 'M9 6l6 6-6 6',
} as const

export type NomeIcone = keyof typeof CAMINHOS

export function Icone({ nome, tamanho = 24, className }: { nome: NomeIcone; tamanho?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  )
}
