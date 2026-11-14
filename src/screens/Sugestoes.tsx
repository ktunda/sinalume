import { useState } from 'react'
import { API_BASE, meusEnvios } from '../lib/comunidade'
import { ehAndroid, ehIOS } from '../lib/plataforma'

const TIPOS = [
  { valor: 'melhoria', rotulo: '💡 Ideia de melhoria' },
  { valor: 'erro', rotulo: '⚠️ Algo não funcionou' },
  { valor: 'sinal', rotulo: '🤟 Sinal errado ou faltando' },
  { valor: 'remocao', rotulo: '🗑️ Remover minhas gravações' },
  { valor: 'outro', rotulo: '💬 Outro assunto' },
] as const

/** Aba de sugestões: qualquer pessoa manda ideias, erros e pedidos — sem conta. */
export function Sugestoes() {
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]['valor']>('melhoria')
  const [texto, setTexto] = useState('')
  const envios = meusEnvios()
  const [codigo, setCodigo] = useState(envios.at(-1)?.id ?? '')
  const [chaveDigitada, setChaveDigitada] = useState('')
  const chaveSalva = envios.find((e) => e.id === codigo)?.chave
  const chave = chaveSalva ?? chaveDigitada.trim().toLowerCase()
  const [estado, setEstado] = useState<'livre' | 'enviando' | 'ok' | 'erro'>('livre')
  const [mensagem, setMensagem] = useState('')

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado('enviando')
    setMensagem('')
    try {
      const r = await fetch(`${API_BASE}/api/sugestao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          texto,
          ...(tipo === 'remocao' ? { codigoEnvio: codigo, chave: chave || undefined } : {}),
          tela: ehAndroid() ? 'android' : ehIOS() ? 'ios' : 'outro',
        }),
      })
      const corpo = (await r.json().catch(() => ({}))) as { erro?: string; id?: string }
      if (!r.ok) throw new Error(corpo.erro ?? `Falha no envio (${r.status}).`)
      setEstado('ok')
      setTexto('')
      setMensagem(
        tipo === 'remocao'
          ? `Pedido de remoção registrado (protocolo ${corpo.id}). As gravações serão retiradas do acervo.`
          : `Obrigado! Sua mensagem foi registrada (protocolo ${corpo.id}).`,
      )
    } catch (err) {
      setEstado('erro')
      setMensagem((err as Error).message.includes('fetch') ? 'Sem conexão. Tente de novo mais tarde.' : (err as Error).message)
    }
  }

  return (
    <form className="tela tela--sugestoes" onSubmit={enviar}>
      <p>
        Ajude a melhorar o Sinalume. Conte o que podemos fazer melhor, o que deu errado ou qual sinal está faltando.
      </p>

      <fieldset className="sugestoes__tipos">
        <legend>Sobre o que é?</legend>
        {TIPOS.map((t) => (
          <label key={t.valor} className={`chip ${tipo === t.valor ? 'chip--ativo' : ''}`}>
            <input type="radio" name="tipo" value={t.valor} checked={tipo === t.valor} onChange={() => setTipo(t.valor)} />
            <span>{t.rotulo}</span>
          </label>
        ))}
      </fieldset>

      {tipo === 'remocao' && (
        <label className="sugestoes__campo">
          Código do envio
          {envios.length > 0 ? (
            <select value={codigo} onChange={(e) => setCodigo(e.target.value)}>
              {envios
                .slice()
                .reverse()
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.id} ({e.exemplos} gravações)
                  </option>
                ))}
            </select>
          ) : (
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.trim())} placeholder="ex.: 2026-11-14-a1b2c3d4" />
          )}
        </label>
      )}
      {tipo === 'remocao' && !chaveSalva && (
        <label className="sugestoes__campo">
          Chave de remoção (se você anotou)
          <input
            value={chaveDigitada}
            onChange={(e) => setChaveDigitada(e.target.value)}
            maxLength={32}
            autoComplete="off"
            spellCheck={false}
            placeholder="32 letras e números"
          />
          <span className="nota">Sem a chave, a equipe vai confirmar com você antes de remover.</span>
        </label>
      )}

      <label className="sugestoes__campo">
        {tipo === 'remocao' ? 'Observação (opcional)' : 'Sua mensagem'}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
          rows={6}
          placeholder={
            tipo === 'sinal'
              ? 'Qual sinal? O que está errado? Na sua região ou igreja ele é feito de outro jeito?'
              : 'Escreva aqui…'
          }
        />
      </label>

      <p className="nota">
        Sua mensagem fica pública no GitHub do projeto para que todos acompanhem. Não escreva nome completo, telefone,
        e-mail ou outros dados pessoais.
      </p>

      <button type="submit" className="botao-principal" disabled={estado === 'enviando'}>
        {estado === 'enviando' ? 'Enviando…' : 'Enviar'}
      </button>
      {mensagem && (
        <p className={estado === 'erro' ? 'erro' : 'comunidade__mensagem'} aria-live="polite">
          {mensagem}
        </p>
      )}
      <p className="nota">
        Acompanhe todas as sugestões em{' '}
        <a href="https://github.com/ktunda/sinalume/issues" target="_blank" rel="noreferrer">
          github.com/ktunda/sinalume/issues
        </a>
        .
      </p>
    </form>
  )
}
