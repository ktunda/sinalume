// No Vercel só rodam as funções de api/. O app em si fica no GitHub Pages.
// Este script cria uma página mínima que aponta para o app.
import { mkdirSync, writeFileSync } from 'node:fs'

mkdirSync('vercel-public', { recursive: true })
writeFileSync(
  'vercel-public/index.html',
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Sinalume — API</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<body style="font-family:system-ui;padding:2rem;max-width:40rem">
<h1>Sinalume</h1><p>Este endereço recebe as contribuições de sinais dos voluntários.
O aplicativo fica no GitHub Pages do projeto.</p></body></html>`,
)
console.log('vercel-public/index.html criado')
