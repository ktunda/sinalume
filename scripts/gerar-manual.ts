// Gera docs/MANUAL.md e docs/manual.json a partir de src/lib/manual.ts (fonte única do manual).
// O JSON alimenta o PDF do manual no padrão da marca (docs/identidade/gerador/manual_usuario.py).
import { writeFileSync } from 'node:fs'
import { MANUAL, manualEmMarkdown, VERSAO_MANUAL } from '../src/lib/manual.js'

writeFileSync('docs/MANUAL.md', manualEmMarkdown() + '\n')
writeFileSync('docs/manual.json', JSON.stringify({ versao: VERSAO_MANUAL, secoes: MANUAL }, null, 1) + '\n')
console.log('[manual] docs/MANUAL.md e docs/manual.json atualizados')
