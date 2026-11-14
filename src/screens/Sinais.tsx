import { useEffect, useMemo, useState } from 'react'
import type { Rota } from '../App'
import { carregarExemplos } from '../lib/acervo'
import { categoriaDe, lerIndice } from '../lib/comunidade'
import { etapaDe, META, type Etapa, type SituacaoSinal } from '../lib/comunidade-tipos'
import { normalizarGlosa, glosaValida } from '../lib/pacote'
import { CATEGORIAS, VOCABULARIO, VOCAB_POR_GLOSA } from '../lib/vocab'

type Filtro = 'todos' | Etapa

const ROTULO_ETAPA: Record<Etapa, string> = {
  falta: 'Falta gravar',
  comecando: 'Precisa de mais pessoas',
  pronto: 'Pronto',
}

interface Linha {
  glosa: string
  rotulo: string
  categoria: string
  comunidade?: SituacaoSinal
  locais: number
  etapa: Etapa
  noVocabulario: boolean
}

/** Lista de sinais: o que já temos, o que falta e o que precisa de mais gente — o mapa da evolução contínua. */
export function Sinais({ ir }: { ir: (r: Rota, params?: Record<string, string>) => void }) {
  const [comunidade, setComunidade] = useState<SituacaoSinal[] | null>(null)
  const [atualizadoEm, setAtualizadoEm] = useState('')
  const [locais, setLocais] = useState<Map<string, number>>(new Map())
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  useEffect(() => {
    lerIndice().then((i) => {
      setComunidade(i?.sinais ?? [])
      setAtualizadoEm(i?.atualizadoEm ?? '')
    })
    carregarExemplos().then((lista) => {
      const m = new Map<string, number>()
      lista.filter((e) => e.origem !== 'comunidade').forEach((e) => m.set(e.glosa, (m.get(e.glosa) ?? 0) + 1))
      setLocais(m)
    })
  }, [])

  const linhas = useMemo<Linha[]>(() => {
    const porGlosa = new Map((comunidade ?? []).map((s) => [s.glosa, s]))
    const todas = new Set<string>([...VOCABULARIO.map((v) => v.glosa), ...porGlosa.keys(), ...locais.keys()])
    return [...todas].map((glosa) => {
      const c = porGlosa.get(glosa)
      const v = VOCAB_POR_GLOSA.get(glosa)
      return {
        glosa,
        rotulo: v?.texto ?? glosa.toLowerCase().replace(/-/g, ' '),
        categoria: categoriaDe(glosa),
        comunidade: c,
        locais: locais.get(glosa) ?? 0,
        etapa: etapaDe(c),
        noVocabulario: !!v,
      }
    })
  }, [comunidade, locais])

  const termo = busca.trim().toLowerCase()
  const visiveis = linhas
    .filter((l) => filtro === 'todos' || l.etapa === filtro)
    .filter((l) => !termo || l.rotulo.toLowerCase().includes(termo) || l.glosa.toLowerCase().includes(termo))
    .sort((a, b) => {
      // o que mais precisa de ajuda aparece primeiro
      const ordem: Record<Etapa, number> = { falta: 0, comecando: 1, pronto: 2 }
      return ordem[a.etapa] - ordem[b.etapa] || a.rotulo.localeCompare(b.rotulo, 'pt-BR')
    })

  const contagem = (e: Etapa) => linhas.filter((l) => l.etapa === e).length
  const prontos = contagem('pronto')
  const glosaNova = normalizarGlosa(busca)
  const podeCriar = busca.trim().length > 1 && glosaValida(glosaNova) && !linhas.some((l) => l.glosa === glosaNova)

  return (
    <div className="tela tela--sinais">
      <section className="progresso" aria-label="Progresso do vocabulário">
        <p>
          <strong>{prontos}</strong> de <strong>{linhas.length}</strong> sinais prontos
        </p>
        <div className="progresso__barra">
          <span style={{ width: `${linhas.length ? (prontos / linhas.length) * 100 : 0}%` }} />
        </div>
        <p className="nota">
          Um sinal fica pronto com {META.exemplos} gravações de pelo menos {META.pessoas} pessoas diferentes.
          {atualizadoEm && ` Acervo atualizado em ${new Date(atualizadoEm).toLocaleDateString('pt-BR')}.`}
        </p>
      </section>

      <div className="digitar">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar ou digitar um sinal novo…"
          aria-label="Buscar ou digitar um sinal novo"
        />
      </div>
      {podeCriar && (
        <button type="button" className="botao-principal" onClick={() => ir('ensinar', { g: glosaNova })}>
          ＋ Gravar sinal novo: “{busca.trim()}”
        </button>
      )}

      <div className="filtros" role="tablist">
        {(['todos', 'falta', 'comecando', 'pronto'] as Filtro[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filtro === f}
            className={filtro === f ? 'filtro--ativo' : ''}
            onClick={() => setFiltro(f)}
          >
            {f === 'todos' ? `Todos (${linhas.length})` : `${ROTULO_ETAPA[f]} (${contagem(f)})`}
          </button>
        ))}
      </div>

      {comunidade === null && <p className="nota">Carregando acervo…</p>}

      <ul className="lista-sinais">
        {visiveis.map((l) => (
          <li key={l.glosa} className={`lista-sinais__item lista-sinais__item--${l.etapa}`}>
            <div>
              <strong>{l.rotulo}</strong>
              <small>
                {CATEGORIAS[l.categoria as keyof typeof CATEGORIAS] ?? 'Outros'}
                {!l.noVocabulario && ' · sugerido pela comunidade'}
              </small>
              <small>
                {ROTULO_ETAPA[l.etapa]}
                {l.comunidade && ` · ${l.comunidade.exemplos} gravações de ${l.comunidade.pessoas} pessoa(s)`}
                {l.comunidade?.ufs.length ? ` · ${l.comunidade.ufs.join(', ')}` : ''}
                {l.locais > 0 && ` · ${l.locais} neste celular`}
              </small>
            </div>
            {l.etapa !== 'pronto' && (
              <button type="button" onClick={() => ir('ensinar', { g: l.glosa })}>
                Gravar
              </button>
            )}
          </li>
        ))}
      </ul>
      {visiveis.length === 0 && !podeCriar && <p className="nota">Nenhum sinal encontrado.</p>}
      <p className="nota">
        Faltou um sinal da sua região ou igreja? Digite no campo acima e grave. Depois da revisão, ele entra no acervo
        de todos.
      </p>
    </div>
  )
}
