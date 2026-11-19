import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCameraMaos } from '../components/useCameraMaos'
import { Comunidade } from '../components/Comunidade'
import { VisorCamera } from '../components/VisorCamera'
import {
  adicionarExemplo,
  carregarExemplos,
  exportarPacote,
  importarPacote,
  removerGlosa,
} from '../lib/acervo'
import { parametroRota } from '../lib/rota'
import { glosaValida, normalizarGlosa } from '../lib/pacote'
import { Segmentador, type Exemplo } from '../lib/reconhecedor'
import { CATEGORIAS, VOCABULARIO, type Categoria } from '../lib/vocab'

const REPETICOES = 5

/**
 * Gravação de sinais por voluntários (intérpretes e pessoas surdas).
 * Cada sinal é gravado 5 vezes; tudo fica no celular e pode ser compartilhado como arquivo.
 */
function glosaDaRota(): string | null {
  const g = parametroRota('g')
  return g && glosaValida(normalizarGlosa(g)) ? normalizarGlosa(g) : null
}

export function Ensinar() {
  const [exemplos, setExemplos] = useState<Exemplo[]>([])
  // veio da lista de sinais (#/ensinar?g=GLOSA): já abre pronto para gravar
  const [glosa, setGlosa] = useState<string | null>(glosaDaRota)
  const [, setGravadas] = useState(0)
  const [mensagem, setMensagem] = useState(() => {
    const g = glosaDaRota()
    return g ? `Faça o sinal "${g}" e abaixe as mãos no fim. Repita ${REPETICOES} vezes.` : ''
  })
  const [capturando, setCapturando] = useState(false)
  const [nova, setNova] = useState('')
  const inputArquivo = useRef<HTMLInputElement>(null)

  const atualizar = useCallback(() => carregarExemplos().then(setExemplos), [])
  useEffect(() => {
    atualizar()
  }, [atualizar])

  const contagem = useMemo(() => {
    const m = new Map<string, number>()
    exemplos.filter((e) => e.origem !== 'comunidade').forEach((e) => m.set(e.glosa, (m.get(e.glosa) ?? 0) + 1))
    return m
  }, [exemplos])

  const segmentador = useMemo(
    () =>
      new Segmentador(async (seq) => {
        if (!glosa) return
        await adicionarExemplo(glosa, seq)
        setGravadas((n) => {
          const prox = n + 1
          setMensagem(
            prox >= REPETICOES
              ? `Pronto! "${glosa}" gravado ${prox} vezes. Já dá para testar em "Surdo sinaliza" neste celular.`
              : `Boa! ${prox} de ${REPETICOES}. Faça de novo.`,
          )
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
    // no iPhone o download começa depois do clique: libera o arquivo só um pouco depois
    window.setTimeout(() => URL.revokeObjectURL(a.href), 30_000)
  }

  const importar = async (arquivo: File) => {
    if (arquivo.size > 30_000_000) {
      setMensagem('Arquivo grande demais (máximo 30 MB).')
      return
    }
    try {
      const n = await importarPacote(await arquivo.text())
      setMensagem(`${n} exemplos importados.`)
      atualizar()
    } catch (e) {
      setMensagem((e as Error).message)
    }
  }

  const categorias = Object.keys(CATEGORIAS) as Categoria[]
  const filtro = nova.trim().toLowerCase()
  const combina = (g: string, rotulo: string) => !filtro || rotulo.toLowerCase().includes(filtro) || g.toLowerCase().includes(filtro)
  const extras = [...contagem.keys()].filter((g) => !VOCABULARIO.some((v) => v.glosa === g) && combina(g, g))

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
        <p>{mensagem || 'Digite ou escolha um sinal para gravar. Use boa luz e deixe mãos e rosto aparecendo.'}</p>
        {mensagem.startsWith('Pronto!') && (
          <a className="botao-principal botao-link" href="#/ver">
            Testar agora em Surdo sinaliza
          </a>
        )}
        {glosa && (
          <button type="button" onClick={() => setGlosa(null)}>
            Cancelar
          </button>
        )}
      </div>

      <form
        className="digitar digitar--destaque"
        onSubmit={(e) => {
          e.preventDefault()
          const g = normalizarGlosa(nova)
          if (glosaValida(g)) {
            escolher(g)
            setNova('')
          } else if (nova.trim()) setMensagem('Use só letras, números e espaços no nome do sinal.')
        }}
      >
        <input
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          placeholder="Digite um sinal"
          aria-label="Digite o sinal que vai gravar ou busque na lista"
        />
        <button type="submit">Gravar</button>
      </form>
      <p className="nota">Digite qualquer palavra ou expressão, ou escolha na lista abaixo.</p>

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
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = '' // permite importar o mesmo arquivo de novo
            if (f) importar(f)
          }}
        />
      </div>

      <Comunidade aoMudar={atualizar} />

      {categorias.filter((c) => VOCABULARIO.some((v) => v.categoria === c && combina(v.glosa, v.texto))).map((c) => (
        <section key={c} className="vocab">
          <h3>{CATEGORIAS[c]}</h3>
          <div className="vocab__lista">
            {VOCABULARIO.filter((v) => v.categoria === c && combina(v.glosa, v.texto)).map((v) => (
              <SinalChip key={v.glosa} glosa={v.glosa} rotulo={v.texto} n={contagem.get(v.glosa) ?? 0} ativo={glosa === v.glosa} aoEscolher={escolher} aoApagar={async (g) => { await removerGlosa(g); atualizar() }} />
            ))}
          </div>
        </section>
      ))}
      {extras.length > 0 && (
        <section className="vocab">
          <h3>Sinais novos gravados aqui</h3>
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
