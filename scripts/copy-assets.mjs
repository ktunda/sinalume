// Copia para public/ os arquivos que o app serve do próprio site (custo zero, funciona offline):
// - avatar 3D do VLibras (vlibras-player-webjs/assets)
// - runtime WebAssembly do MediaPipe (@mediapipe/tasks-vision/wasm)
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const copies = [
  ['node_modules/vlibras-player-webjs/assets', 'public/assets/vlibras'],
  ['node_modules/@mediapipe/tasks-vision/wasm', 'public/mediapipe/wasm'],
];

for (const [from, to] of copies) {
  const src = join(root, from);
  const dst = join(root, to);
  if (!existsSync(src)) {
    console.error(`[copy-assets] não encontrado: ${from} — rode "npm install"`);
    process.exit(1);
  }
  mkdirSync(dst, { recursive: true });
  // do MediaPipe só usamos a variante clássica (não-módulo) do WebAssembly
  cpSync(src, dst, { recursive: true, filter: (f) => !f.includes('module_internal') });
  console.log(`[copy-assets] ${from} -> ${to}`);
}
