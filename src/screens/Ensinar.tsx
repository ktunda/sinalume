import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCameraMaos } from '../components/useCameraMaos'
import { VisorCamera } from '../components/VisorCamera'
import {
  adicionarExemplo,
  carregarExemplos,
  exportarPacote,
  importarPacote,
  removerGlosa,
} from '../lib/acervo'
import { Segmentador, type Exemplo } from '../lib/reconhecedor'
import { CATEGORIAS, VOCABULARIO, type Categoria } from '../lib/vocab'

const REPETICOES = 5

/**
 * Gravação de sinais por voluntários (intérpretes e pessoas surdas).
 * Cada sinal é gravado 5 vezes; tudo fica no celular e pode ser compartilhado como arquivo.
 */
export function Ensinar() {
  const [exemplos, setExemplos] = useState<Exemplo[]>([])
  const [glosa, setGlosa] = useState<string | null>(null)
  const [, setGravadas] = useState(0)
  const [mensagem, setMensagem] = useState('')
  const [capturando, setCapturando] = useState(false)
  const [nova, setNova] = useState('')
  const inputArquivo = useRef<HTMLInputElement>(null)

  const atualizar = useCallback(() => carregarExemplos().then(setExemplos), [])
  useEffect(() => {
    atualizar()
  }, [atualizar])

  const contagem = useMemo(() => {
    const m = new Map<string, number>()
    exemplos.forEach((e) => m.set(e.glosa, (m.get(e.glosa) ?? 0) + 1))
    return m
  }, [exemplos])

  const segmentador = useMemo(
    () =>
      new Segmentador(async (seq) => {
        if (!glosa) return
        await adicionarExemplo(glosa, seq)
        setGravadas((n) => {
          const prox = n + 1
          setMensagem(prox >= REPETICOES ? `Pronto! "${glosa}" gravado ${prox} vezes.` : `Boa! ${prox} de ${REPETICOES}. Faça de novo.`)
          if (prox >= REPETICOES) setGlosa(null)
          return prox
        })
        atualizar()
      }),
    [glosa, atualizar],
  )

  const cam = useCameraMaos(
    (q) => {
      if (!glosa) return
      segmentador.alimentar(q)
      if (segmentador.capturando !== capturando) setCapturando(segmentador.capturando)
    },
    { traseira: false, fpsMax: 15 },
  )

  const escolher = (g: string) => {
    segmentador.reiniciar()
    setGlosa(g)
    setGravadas(0)
    setMensagem(`Faça o sinal "${g}" e abaixe as mãos no fim. Repita ${REPETICOES} vezes.`)
  }

  const exportar = async () => {
    const blob = await exportarPacote()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sinalume-sinais-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importar = async (arquivo: File) => {
    try {
      const n = await importarPacote(await arquivo.text())
      setMensagem(`${n} exemplos importados.`)
      atualizar()
    } catch (e) {
      setMensagem((e as Error).message)
    }
  }

  const categorias = Object.keys(CATEGORIAS) as Categoria[]
  const extras = [...contagem.keys()].filter((g) => !VOCABULARIO.some((v) => v.glosa === g))

  return (
    <div className="tela tela--ensinar">
      <VisorCamera
        videoRef={cam.videoRef}
        canvasRef={cam.canvasRef}
        estado={cam.estado}
        erro={cam.erro}
        maosVisiveis={cam.maosVisiveis}
        espelhar={!cam.traseira}
        capturando={capturando}
        aoAlternar={cam.alternarCamera}
      />

      <div className="aviso-card" aria-live="polite">
        <p>{mensagem || 'Escolha um sinal abaixo para gravar. Use boa luz e deixe mãos e rosto aparecendo.'}</p>
        {glosa && (
          <button type="button" onClick={() => setGlosa(null)}>
            Cancelar
          </button>
        )}
      </div>

      <div className="acoes">
        <button type="button" onClick={exportar} disabled={exemplos.length === 0}>
          ⬇ Exportar sinais
        </button>
        <button type="button" onClick={() => inputArquivo.current?.click()}>
          ⬆ Importar pacote
        </button>
        <input
          ref={inputArquivo}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])}
        />
      </div>

      <form
        className="digitar"
        onSubmit={(e) => {
          e.preventDefault()
          const g = nova.trim().toUpperCase().replace(/\s+/g, '-')
          if (g) escolher(g)
          setNova('')
        }}
      >
        <input value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Novo sinal (ex.: CÉLULA-JOVENS)" />
        <button type="submit">Gravar</button>
      </form>

      {categorias.map((c) => (
        <section key={c} className="vocab">
          <h3>{CATEGORIAS[c]}</h3>
          <div className="vocab__lista">
            {VOCABULARIO.filter((v) => v.categoria === c).map((v) => (
              <SinalChip key={v.glosa} glosa={v.glosa} rotulo={v.texto} n={contagem.get(v.glosa) ?? 0} ativo={glosa === v.glosa} aoEscolher={escolher} aoApagar={async (g) => { await removerGlosa(g); atualizar() }} />
            ))}
          </div>
        </section>
      ))}
      {extras.length > 0 && (
        <section className="vocab">
          <h3>Outros sinais</h3>
          <div className="vocab__lista">
            {extras.map((g) => (
              <SinalChip key={g} glosa={g} rotulo={g.toLowerCase()} n={contagem.get(g) ?? 0} ativo={glosa === g} aoEscolher={escolher} aoApagar={async (x) => { await removerGlosa(x); atualizar() }} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SinalChip(props: {
  glosa: string
  rotulo: string
  n: number
  ativo: boolean
  aoEscolher: (g: string) => void
  aoApagar: (g: string) => void
}) {
  return (
    <span className={`chip ${props.ativo ? 'chip--ativo' : ''} ${props.n > 0 ? 'chip--gravado' : ''}`}>
      <button type="button" onClick={() => props.aoEscolher(props.glosa)}>
        {props.rotulo}
        {props.n > 0 && <small> · {props.n}</small>}
      </button>
      {props.n > 0 && (
        <button type="button" className="chip__apagar" aria-label={`Apagar gravações de ${props.rotulo}`} onClick={() => props.aoApagar(props.glosa)}>
          ×
        </button>
      )}
    </span>
  )
}
