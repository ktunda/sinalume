import { useCallback, useEffect, useState } from 'react'
import { baixarAcervo, enviarContribuicao, haAtualizacao, resumoLocal } from '../lib/comunidade'
import { UFS, type UF } from '../lib/pacote'

const CHAVE_PERFIL = 'sinalume:perfil'

function lerPerfil(): { apelido: string; uf: UF | '' } {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_PERFIL) ?? '') as { apelido: string; uf: UF | '' }
  } catch {
    return { apelido: '', uf: '' }
  }
}

/** Painel de troca de sinais com a comunidade: enviar gravações e baixar o acervo atualizado. */
export function Comunidade({ aoMudar }: { aoMudar?: () => void }) {
  const [resumo, setResumo] = useState<Awaited<ReturnType<typeof resumoLocal>> | null>(null)
  const [perfil, setPerfil] = useState(lerPerfil)
  const [consentimento, setConsentimento] = useState(false)
  const [ocupado, setOcupado] = useState<'enviar' | 'baixar' | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [novidade, setNovidade] = useState(false)

  const atualizar = useCallback(() => {
    resumoLocal().then(setResumo)
    haAtualizacao().then(setNovidade)
  }, [])
  useEffect(atualizar, [atualizar])

  const salvarPerfil = (p: typeof perfil) => {
    setPerfil(p)
    try {
      localStorage.setItem(CHAVE_PERFIL, JSON.stringify(p))
    } catch {
      /* ignore */
    }
  }

  const enviar = async () => {
    setOcupado('enviar')
    setMensagem('')
    try {
      const r = await enviarContribuicao({ apelido: perfil.apelido, uf: perfil.uf || undefined, consentimento })
      setMensagem(
        r.enviados === 0
          ? 'Não há gravações novas para enviar.'
          : `Obrigado! ${r.enviados} gravações enviadas. Depois da revisão, elas chegam para todos.`,
      )
    } catch (e) {
      setMensagem((e as Error).message)
    } finally {
      setOcupado(null)
      atualizar()
    }
  }

  const baixar = async () => {
    setOcupado('baixar')
    setMensagem('')
    try {
      const r = await baixarAcervo()
      setMensagem(`Acervo atualizado: ${r.glosas} sinais da comunidade (${r.exemplos} exemplos).`)
      aoMudar?.()
    } catch (e) {
      setMensagem((e as Error).message)
    } finally {
      setOcupado(null)
      atualizar()
    }
  }

  return (
    <section className="comunidade">
      <h2>Sinais da comunidade</h2>
      <p className="nota">
        {resumo
          ? `${resumo.glosasComunidade} sinais da comunidade neste celular · ${resumo.gravados} gravações suas` +
            (resumo.pendentes ? ` (${resumo.pendentes} ainda não enviadas)` : '')
          : 'Carregando…'}
      </p>

      <button type="button" className="botao-principal" onClick={baixar} disabled={ocupado !== null}>
        {ocupado === 'baixar' ? 'Baixando…' : novidade ? '⬇ Baixar sinais novos da comunidade' : '⬇ Atualizar sinais da comunidade'}
      </button>

      {resumo && resumo.pendentes > 0 && (
        <div className="comunidade__envio">
          <h3>Enviar minhas gravações</h3>
          <div className="comunidade__campos">
            <input
              value={perfil.apelido}
              maxLength={40}
              onChange={(e) => salvarPerfil({ ...perfil, apelido: e.target.value })}
              placeholder="Apelido (opcional)"
              aria-label="Apelido (opcional)"
            />
            <select
              value={perfil.uf}
              onChange={(e) => salvarPerfil({ ...perfil, uf: e.target.value as UF | '' })}
              aria-label="Estado"
            >
              <option value="">Estado (opcional)</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
          <label className="alternador comunidade__termo">
            <input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} />
            <span>
              Concordo em doar ao Sinalume os pontos das mãos destas gravações (não o vídeo), para uso aberto e
              gratuito sob a licença CC BY 4.0. O apelido e o estado são opcionais.
            </span>
          </label>
          <button type="button" onClick={enviar} disabled={!consentimento || ocupado !== null}>
            {ocupado === 'enviar' ? 'Enviando…' : `⬆ Enviar ${resumo.pendentes} gravações`}
          </button>
        </div>
      )}
      {mensagem && (
        <p className="comunidade__mensagem" aria-live="polite">
          {mensagem}
        </p>
      )}
    </section>
  )
}
