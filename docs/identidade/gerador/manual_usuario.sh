#!/bin/sh
# Gera o PDF do manual do usuário em duas passadas (a 2ª preenche as páginas do sumário).
set -e
D=$(dirname "$0"); J=${1:-$D/../../manual.json}; OUT=${2:-$D/manual-usuario.pdf}
python3 "$D/manual_usuario.py" "$J"
node "$D/render.cjs" "$(cd "$D" && pwd)/manual-usuario.html" "$OUT"
python3 - "$OUT" "$D/paginas.json" "$J" <<'P'
import subprocess, sys, json, re
pdf, out = sys.argv[1], sys.argv[2]
n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))
ids = [c['id'] for c in json.load(open(sys.argv[3]))['capitulos']] + ['outros']
pags = {}
for p in range(1, n + 1):
    t = subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), pdf, '-'], capture_output=True, text=True).stdout
    m = re.search(r'CAP[IÍ]TULO 0(\d)', t, re.I)
    if m: pags[ids[int(m.group(1)) - 1]] = f'{p:02d}'
json.dump(pags, open(out, 'w')); print(pags)
P
python3 "$D/manual_usuario.py" "$J" "$D/paginas.json"
node "$D/render.cjs" "$(cd "$D" && pwd)/manual-usuario.html" "$OUT"
echo "PDF: $OUT"
