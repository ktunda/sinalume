# Dados e treino do Sinalume

Tudo aqui roda de graça: no seu computador, no Kaggle Notebooks ou no Google Colab.

## 1. Baixar o V-LIBRASIL

Baixe os vídeos em [IEEE DataPort — V-LIBRASIL](https://ieee-dataport.org/documents/v-librasil-new-dataset-signs-brazilian-sign-language-libras)
(conta gratuita). Os vídeos ficam só na sua máquina; o projeto publica apenas os pontos extraídos.
Opcional: [MINDS-Libras](https://zenodo.org/records/2667329) (20 sinais, 12 pessoas) para variar sinalizantes.

## 2. Extrair os pontos das mãos

```bash
pip install -r requirements.txt
python extrair_pontos.py --videos /caminho/V-LIBRASIL --saida pontos.jsonl
```

Por padrão a glosa é o nome da pasta de cada vídeo. Se a glosa estiver no nome do arquivo, informe uma regex,
por exemplo `--regex-glosa "^(?P<glosa>.+?)_(?P<sinalizante>\d+)$"` — confira o padrão de nomes da sua cópia
do dataset antes. O script pode ser interrompido e retomado.

## 3. Gerar o pacote para o app (caminho rápido, sem treino)

```bash
python gerar_pacote.py --pontos pontos.jsonl --saida ../acervo/base/pacote-vlibrasil.json --glosas ../src/lib/vocab.ts
```

Gera só os sinais do vocabulário inicial e lista os que não existem no dataset (grave esses com voluntários).
Faça commit do arquivo em `acervo/base/`: na próxima publicação ele entra no acervo da comunidade e todos recebem.
Sem `--glosas`, inclui todos os 1.364 termos do dataset.

## 4. Treinar a rede neural (Fase 1, opcional)

Quando o vocabulário crescer (150+ sinais) ou houver muitos sinalizantes:

```bash
python treinar.py --pontos pontos.jsonl --saida modelo/ --epocas 60
```

O teste usa **pessoas que o modelo nunca viu** — a meta do MVP é ≥ 90% de acerto nesse cenário.
Saída: `modelo/sinalume.onnx` + `modelo/rotulos.json`, para carregar no app com `onnxruntime-web`.

## Testes

```bash
python test_caracteristicas.py
```

O vetor de características (132 valores por quadro) precisa ser idêntico ao de `src/lib/maos.ts`.
