export function Sobre() {
  return (
    <div className="tela tela--sobre">
      <img src="./sinalume-logo.svg" alt="Sinalume" className="sobre__logo" />
      <p>
        O <strong>Sinalume</strong> é um app gratuito, sem anúncios e de código aberto para ajudar a conversa entre
        pessoas surdas e ouvintes. Não tem fins comerciais.
      </p>

      <h2>Privacidade</h2>
      <ul>
        <li>O vídeo da câmera é processado só no seu celular e nunca é enviado.</li>
        <li>Os sinais gravados ficam guardados só neste aparelho, até você exportar.</li>
        <li>
          A fala é transcrita pelo serviço de voz do navegador (Google, no Chrome) e o texto vai para o VLibras para
          virar Libras.
        </li>
        <li>Não há cadastro, login nem rastreamento.</li>
      </ul>

      <h2>Importante</h2>
      <p>
        O Sinalume reconhece um vocabulário limitado de sinais e pode errar. Ele não substitui um intérprete de Libras
        em situações importantes, como consultas médicas e assuntos jurídicos.
      </p>

      <h2>Créditos</h2>
      <ul>
        <li>Avatar e tradução para Libras: VLibras (Governo Federal e UFPB), LGPL-3.0.</li>
        <li>Detecção de mãos: MediaPipe (Google), Apache-2.0.</li>
        <li>
          Bancos de sinais usados no treino: V-LIBRASIL (IEEE DataPort) e MINDS-Libras (Zenodo), CC BY 4.0 — créditos aos seus autores.
        </li>
        <li>Fonte da marca: Nunito (OFL).</li>
      </ul>
      <p className="nota">Código aberto sob licença GPL-3.0. Contribuições são bem-vindas.</p>
    </div>
  )
}
