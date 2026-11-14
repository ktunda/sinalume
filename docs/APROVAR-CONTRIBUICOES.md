# Como aprovar sinais enviados por voluntários

Tempo: cerca de 1 minuto por envio. Não precisa saber programar.

1. Você recebe um e-mail do GitHub: **"Contribuição: 12 gravações · ÁGUA ×5, DEUS ×5…"**.
   Também dá para ver todos em **Pull requests** no repositório (filtro `label:contribuição`).
2. Abra o pedido e leia o comentário **"Verificação automática da contribuição"**:
   - ✅ **tudo certo** → clique em **Merge pull request** › **Confirm merge**.
   - ⚠️ **parece outro sinal** → o sinal pode estar errado. Peça a um intérprete para conferir; se não der,
     feche o pedido (**Close pull request**). O voluntário pode gravar de novo.
   - ❌ **formato inválido** ou **altera arquivos fora do acervo** → feche sem aprovar.
3. Em poucos minutos o GitHub publica o app atualizado. Quem tocar em **Atualizar sinais da comunidade**
   (em *Ensinar sinais*) recebe os sinais novos.

## Boas práticas

- Prefira aprovar quem gravou **5 repetições** de cada sinal.
- Sinais regionais ou de uma denominação são bem-vindos — eles ficam juntos do sinal principal como variantes.
- O acervo publica até **8 exemplos por sinal**, alternando entre pessoas diferentes, para o arquivo continuar leve
  para quem tem pouco plano de dados. Todos os envios ficam guardados no repositório para o treino da rede neural.
- Para remover um envio já aprovado, apague o arquivo em `acervo/contribuicoes/` (botão de lixeira no GitHub).

## Como funciona por trás

```
App (voluntário) ─► api/contribuir (Vercel, grátis) ─► Pull Request no GitHub ─► verificação automática
                                                                              └► você aprova ─► GitHub Pages publica
                                                                                               public/acervo/*.json
App (todos) ◄──────────────────────── "Atualizar sinais da comunidade" ◄──────────────────────┘
```

- A função não guarda IP nem dados pessoais; o apelido e o estado são opcionais.
- Os arquivos guardam só pontos das mãos (números), nunca vídeo. Licença: CC BY 4.0.
