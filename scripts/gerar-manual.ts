// Gera docs/MANUAL.md a partir de src/lib/manual.ts (fonte única do manual).
import { writeFileSync } from 'node:fs'
import { manualEmMarkdown } from '../src/lib/manual.js'

writeFileSync('docs/MANUAL.md', manualEmMarkdown() + '\n')
console.log('[manual] docs/MANUAL.md atualizado')
