# Evolução contínua do Sinalume

O Sinalume melhora a cada sinal gravado. O ciclo abaixo roda sem custo e quase sem trabalho manual.

```
   ┌──────────────┐    ┌───────────────┐    ┌───────────────┐    ┌──────────────┐
   │ 1. Priorizar │ ─► │ 2. Gravar     │ ─► │ 3. Revisar    │ ─► │ 4. Publicar  │
   │ lista "falta"│    │ voluntários   │    │ verificação + │    │ acervo novo  │
   │ + sugestões  │    │ 5x cada sinal │    │ 1 clique      │    │ para todos   │
   └──────▲───────┘    └───────────────┘    └───────────────┘    └──────┬───────┘
          └──────────────── 5. Medir: o que falta, o que erra ◄──────────┘
```

## 1. Priorizar

- A tela **Sinais que temos** mostra cada sinal em três situações: **Falta gravar**, **Precisa de mais pessoas**
  e **Pronto** (10 gravações de pelo menos 3 pessoas diferentes).
- Sinais pedidos na aba **Sugestões** viram issues com o rótulo `sinal` no GitHub — são a fila de prioridades.
- Qualquer pessoa pode digitar um sinal novo (regional, de uma igreja, de uma profissão) e gravar na hora.

## 2. Gravar

- Mutirões de gravação em igrejas, associações e escolas: cada pessoa grava 5 vezes os sinais da lista "Falta gravar".
- Variedade vale mais que quantidade: pessoas de idades, regiões e tons de pele diferentes, celulares diferentes.
- Ninguém precisa de conta. O termo de consentimento é aceito no próprio app.

## 3. Revisar

- A cada hora, os envios viram pedidos de aprovação no GitHub com um relatório automático.
- Quem coordena lê o relatório e clica em **Merge** (ou fecha, se o sinal estiver errado).
- Pedidos de remoção chegam como issues `remoção` e devem ser atendidos em até 15 dias.

## 4. Publicar

- Cada aprovação republica o app e o acervo automaticamente.
- Os celulares recebem os sinais novos em **Atualizar sinais da comunidade**.

## 5. Medir

- Progresso do vocabulário: barra "X de Y sinais prontos" na tela Sinais.
- Qualidade: alertas da verificação automática (sinal parecido com outro, repetições incoerentes).
- Uso real: issues `erro` e `sinal` vindas do app.

## Marcos

| Marco | Gatilho | O que muda |
| --- | --- | --- |
| Vocabulário inicial pronto | 87 sinais prontos | Testes com 5 pessoas surdas (gate da Fase 0) |
| Rede neural | 150+ sinais prontos ou 2.000+ gravações | Treinar `training/treinar.py` no Kaggle/Colab e trocar o DTW pelo modelo ONNX |
| Frases | Rede com ≥ 90% de acerto em pessoas novas | Reconhecer sequências de sinais sem pausa |
| Expressões faciais | Rede estável | Incluir pontos do rosto (perguntas, negação, intensidade) |
| Ampliação | Pedidos recorrentes por área | Pacotes temáticos: saúde, escola, trabalho, igreja |
