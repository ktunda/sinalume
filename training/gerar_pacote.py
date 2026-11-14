"""Gera um pacote de sinais (.json) que o app importa em "Ensinar sinais > Importar pacote".

É o caminho mais rápido e de custo zero para o app reconhecer sinais do V-LIBRASIL:
não precisa treinar rede neural — o app compara cada sinal feito na câmera com estes exemplos (DTW).

Uso:
  python gerar_pacote.py --pontos pontos.jsonl --saida pacote-vlibrasil.json \
      --glosas ../src/lib/vocab.ts --max-por-glosa 6

--glosas aceita um arquivo .txt (uma glosa por linha) ou o próprio vocab.ts do app, para gerar
só os sinais do vocabulário inicial (o app fica mais rápido com menos exemplos).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

from caracteristicas import DIM, QUADROS_NORMALIZADOS, reamostrar


def normalizar(g: str) -> str:
    """Compara glosas sem diferenciar acento, caixa e separador (ÁGUA == agua == Água)."""
    g = unicodedata.normalize("NFKD", g).encode("ascii", "ignore").decode()
    return re.sub(r"[\s_-]+", "-", g.strip().upper())


def ler_glosas(caminho: Path) -> set[str]:
    texto = caminho.read_text(encoding="utf-8")
    if caminho.suffix == ".ts":
        return {normalizar(g) for g in re.findall(r"\['([^']+)',\s*'", texto)}
    return {normalizar(l) for l in texto.splitlines() if l.strip()}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pontos", required=True, type=Path)
    ap.add_argument("--saida", required=True, type=Path)
    ap.add_argument("--glosas", type=Path, help="filtra só estas glosas (.txt ou vocab.ts)")
    ap.add_argument("--max-por-glosa", type=int, default=6)
    ap.add_argument("--origem", default="V-LIBRASIL (CC BY 4.0)")
    args = ap.parse_args()

    filtro = ler_glosas(args.glosas) if args.glosas else None
    por_glosa: dict[str, list[list[list[float]]]] = defaultdict(list)
    nome_original: dict[str, str] = {}
    with args.pontos.open(encoding="utf-8") as f:
        for linha in f:
            r = json.loads(linha)
            chave = normalizar(r["glosa"])
            if filtro is not None and chave not in filtro:
                continue
            if len(por_glosa[chave]) >= args.max_por_glosa:
                continue
            q = r["quadros"]
            if not q or len(q[0]) != DIM:
                continue
            por_glosa[chave].append([[round(x, 3) for x in l] for l in reamostrar(q)])
            nome_original.setdefault(chave, r["glosa"].upper())

    exemplos = [{"glosa": nome_original[g], "quadros": qs} for g, lista in por_glosa.items() for qs in lista]
    pacote = {
        "formato": "sinalume-exemplos",
        "versao": 1,
        "dim": DIM,
        "quadros": QUADROS_NORMALIZADOS,
        "origem": args.origem,
        "exemplos": exemplos,
    }
    args.saida.write_text(json.dumps(pacote, ensure_ascii=False), encoding="utf-8")
    print(f"{len(por_glosa)} sinais, {len(exemplos)} exemplos -> {args.saida}")
    if filtro is not None:
        faltando = sorted(filtro - set(por_glosa))
        if faltando:
            print(f"Sem exemplos no dataset ({len(faltando)}): {', '.join(faltando)}")
            print("Grave esses sinais com voluntários no próprio app (Ensinar sinais).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
