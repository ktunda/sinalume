# Como contribuir com o Sinalume

O Sinalume é feito por voluntários. Toda ajuda conta — e nem toda ajuda é programação.

## Sem programar

- **Gravar sinais** (pessoas surdas e intérpretes): abra o app, vá em *Ensinar sinais*, grave cada sinal 5 vezes
  com boa luz e mãos e rosto visíveis, e toque em **Enviar minhas gravações**. Não precisa de conta.
  Quanto mais pessoas diferentes gravarem (idades, regiões, igrejas), melhor o app reconhece todo mundo.
- **Revisar o vocabulário**: sugira sinais que faltam, especialmente variações regionais e de cada denominação.
- **Testar**: use o app em conversas reais e conte o que deu errado (abra uma *Issue* no GitHub ou fale com a
  coordenação).
- **Divulgar** em igrejas, associações de surdos, escolas e faculdades.

### Consentimento para gravação

Quem grava sinais concorda que os **pontos das mãos** (não o vídeo) sejam usados para treinar o Sinalume e
publicados como parte do projeto aberto. O app não grava vídeo — só coordenadas numéricas. A pessoa pode pedir a
remoção das suas gravações a qualquer momento.

## Programando

1. Faça um *fork*, crie uma branch e rode `npm install && npm run dev`.
2. Antes de enviar: `npm test` e `npm run build` sem erros.
3. Abra um *Pull Request* explicando o que mudou e como testar.

Regras do projeto:

- **Custo zero**: nada de serviço pago, chave de API paga ou servidor próprio.
- **Privacidade**: vídeo nunca sai do aparelho; nada de rastreamento ou anúncios.
- **Celular simples primeiro**: teste em Android de entrada (2–3 GB de RAM) e conexão lenta.
- **Acessibilidade**: textos grandes, contraste alto, nenhum aviso só por som.
- Se mudar o vetor de características em `src/lib/maos.ts`, mude igual em `training/caracteristicas.py`.

## Boas primeiras tarefas

- Melhorar as regras de frase em `src/lib/frase.ts` (artigos, preposições, mais verbos).
- Carregar o modelo ONNX treinado por `training/treinar.py` com `onnxruntime-web` (classificador da Fase 1).
- Adicionar pontos do rosto e do corpo (MediaPipe Face/Pose) ao vetor de características.
- Tela de "conversa" com os dois sentidos lado a lado.
