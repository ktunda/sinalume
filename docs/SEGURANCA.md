# Segurança do Sinalume

Última revisão: 13/11/2026. Este documento lista o que foi verificado, o que foi corrigido e o que continua como risco aceito.

## Como o app é montado (superfície de ataque)

- **App (GitHub Pages):** site estático em React. Não tem servidor próprio, banco de dados, login nem cookies.
- **Funções no Vercel:** `/api/contribuir` (recebe gravações), `/api/sugestao` (recebe mensagens) e `/api/pendentes` (lista o que chegou, só para a automação). Os dados ficam no Vercel Blob (privado, apagado após 60 dias).
- **Automação do GitHub:** a cada hora, transforma gravações em pedidos de aprovação (PR) e mensagens em issues.

## SQL injection e injeções em geral

- **SQL injection:** não se aplica. O projeto não usa banco de dados nem consultas SQL. Os dados são arquivos JSON.
- **Caminhos de arquivo:** os nomes no Blob são montados só a partir de identificadores conferidos por expressão regular (`AAAA-MM-DD-xxxxxxxx`). Não dá para "subir de pasta" (path traversal).
- **XSS (código malicioso na página):** o React escapa todo texto. Não há `innerHTML` nem `dangerouslySetInnerHTML`. As glosas só aceitam letras maiúsculas, números e hífen.
- **Injeção de comandos na automação:** títulos e textos vindos de usuários entram no shell só por `$(cat arquivo)` entre aspas, que não é reinterpretado. Pull requests de forks rodam sem segredos e com permissão só de leitura.

## Corrigido nesta revisão

| # | Gravidade | Problema | Correção |
|---|---|---|---|
| 1 | Alta | `/api/pendentes` era público: qualquer pessoa podia listar e baixar gravações e mensagens ainda não revisadas. | Agora só aceita o token OIDC que o GitHub Actions emite a cada execução, conferindo assinatura, repositório `ktunda/sinalume`, ramo `main` e que não é pull request. Não há senha guardada. |
| 2 | Alta (privacidade) | Ao sair da tela enquanto o navegador pedia permissão, a **câmera** (ou o **microfone**) podia ficar ligada. | A câmera e o microfone são desligados assim que a tela fecha, mesmo durante o pedido de permissão. |
| 3 | Média | Qualquer pessoa podia pedir a remoção das gravações de outra, porque o código do envio aparece no pedido de aprovação público. | Cada envio recebe uma **chave secreta de remoção** (128 bits). Ela fica só no celular de quem enviou; o servidor guarda apenas o resumo SHA-256. A issue de remoção informa se a chave confere. |
| 4 | Média | Dependência com falha conhecida (`zod` < 4.6.6, via `@vercel/blob`), que permitia esgotar a memória. | Fixado `zod` ^4.6.7 (`overrides`). `npm audit --omit=dev`: 0 falhas. |
| 5 | Média | O apelido do voluntário entrava sem limpeza no pedido de aprovação (links, HTML, menções). | Apelido só aceita letras, números, espaço e `. - '`. |
| 6 | Baixa | Texto de sugestões podia levar HTML e imagens escondidas para a issue. | `<`, `>` e `![` são neutralizados. As menções `@` já eram. |
| 7 | Baixa | O tipo de sugestão aceitava nomes herdados (`toString`, `constructor`). | Validação com `Object.hasOwn`. |
| 8 | Baixa | O limite de envios por IP usava o primeiro valor de `X-Forwarded-For`, que pode ser falsificado. | Usa `x-real-ip`, o IP informado pelo próprio Vercel. |
| 9 | Baixa | Com `ORIGENS_PERMITIDAS` vazio, o CORS aceitava qualquer site. | Padrão restrito a `https://ktunda.github.io` e endereços locais de desenvolvimento. |
| 10 | Defesa extra | Faltava política de segurança de conteúdo (CSP). | CSP no `index.html` limita scripts ao próprio site e conexões aos serviços usados (VLibras, MediaPipe, base da comunidade, transcrição). Também foram adicionados `object-src 'none'` e `referrer` restrito. Testado sem violações em todas as telas, com o avatar carregando. |

## Erros corrigidos

- **Frase falada depois de sair:** a frase reconhecida podia ser falada depois de sair da tela ou de tocar em "Nova frase".
- **Exportar no iPhone:** o arquivo podia não baixar, porque o link era liberado cedo demais.
- **Importar pacote:** importar o mesmo arquivo duas vezes não fazia nada, e não havia limite de tamanho (agora 30 MB).
- **Dicionário do avatar:** os sinais do VLibras não ficavam guardados no celular, porque o endereço do cache estava errado. Agora ficam, e o app gasta menos dados.

## Riscos aceitos

- **`'unsafe-eval'` na CSP:** exigido pelo player Unity do VLibras (2018). Sai quando o VLibras publicar um player novo.
- **Transformers.js carregado do jsDelivr:** a versão é fixa (4.3.2), mas sem verificação de integridade, porque é um `import()` dinâmico num worker.
- **Limite por IP:** vale por instância do Vercel. A proteção principal é a revisão humana de cada envio.
- **Falhas em ferramentas de build:** `workbox-build`, `glob` e `minimatch` têm falhas conhecidas, mas só rodam na hora de montar o site e não chegam a quem usa o app.

## Como verificar

```bash
npm test          # inclui tests/seguranca.test.ts (token OIDC, chave de remoção, limpeza de textos)
npm audit --omit=dev
```
