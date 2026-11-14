# Gerador dos materiais da marca

Gera o **Manual da Marca** e a **Apresentação do projeto** em PDF, seguindo a identidade do Sinalume.

1. `npm pack @fontsource-variable/nunito` e extraia para `fonts/fontsource-variable-nunito-<versão>/` (ajuste o caminho em `comum.py`).
2. `pip install segno` (QR codes).
3. `python3 manual_marca.py && node render.cjs $PWD/manual-da-marca.html manual.pdf`
4. `python3 apresentacao.py && node render.cjs $PWD/apresentacao.html apresentacao.pdf`

Toda função nova do app deve ser incluída em `apresentacao.py` (e em `src/lib/manual.ts`) antes de gerar o PDF.

## Manual do usuário (PDF)

1. `npm run manual` (gera `docs/MANUAL.md` e `docs/manual.json` a partir de `src/lib/manual.ts`)
2. `sh docs/identidade/gerador/manual_usuario.sh docs/manual.json docs/Sinalume-Manual.pdf`

O script faz duas passadas para preencher as páginas do sumário. Seção nova sem capítulo entra em "Outras funções".
