"""Fase 1: treina um classificador neural leve (GRU) sobre os pontos e exporta para ONNX.

Use quando o vocabulário passar de ~150 sinais: o DTW do app fica lento com muitos exemplos,
e uma rede pequena generaliza melhor para pessoas que não gravaram exemplos.
Roda de graça no Kaggle Notebooks ou Google Colab (GPU gratuita), ou até em CPU.

Uso:
  python treinar.py --pontos pontos.jsonl --saida modelo/ --epocas 60

Saídas: modelo/sinalume.onnx e modelo/rotulos.json. A avaliação separa sinalizantes:
o teste usa pessoas que o modelo nunca viu, que é o que importa na rua.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from collections import defaultdict
from pathlib import Path

from caracteristicas import DIM, QUADROS_NORMALIZADOS, reamostrar


def carregar(caminho: Path):
    dados = []
    with caminho.open(encoding="utf-8") as f:
        for linha in f:
            r = json.loads(linha)
            dados.append((r["glosa"], r.get("sinalizante", "?"), reamostrar(r["quadros"])))
    return dados


def dividir_por_sinalizante(dados, fracao_teste=0.2, semente=7):
    sinalizantes = sorted({s for _, s, _ in dados})
    random.Random(semente).shuffle(sinalizantes)
    if len(sinalizantes) < 2:
        print("Aviso: só um sinalizante; usando divisão aleatória (a acurácia ficará otimista).")
        random.Random(semente).shuffle(dados)
        corte = int(len(dados) * (1 - fracao_teste))
        return dados[:corte], dados[corte:]
    n_teste = max(1, int(len(sinalizantes) * fracao_teste))
    teste = set(sinalizantes[:n_teste])
    return [d for d in dados if d[1] not in teste], [d for d in dados if d[1] in teste]


def main() -> int:
    import torch
    from torch import nn

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pontos", required=True, type=Path)
    ap.add_argument("--saida", default=Path("modelo"), type=Path)
    ap.add_argument("--epocas", type=int, default=60)
    ap.add_argument("--min-exemplos", type=int, default=3, help="ignora glosas com menos exemplos que isso")
    args = ap.parse_args()

    dados = carregar(args.pontos)
    contagem = defaultdict(int)
    for g, _, _ in dados:
        contagem[g] += 1
    dados = [d for d in dados if contagem[d[0]] >= args.min_exemplos]
    rotulos = sorted({g for g, _, _ in dados})
    idx = {g: i for i, g in enumerate(rotulos)}
    treino, teste = dividir_por_sinalizante(dados)
    print(f"{len(rotulos)} sinais | treino {len(treino)} | teste {len(teste)}")

    def tensores(lista):
        x = torch.tensor([q for _, _, q in lista], dtype=torch.float32)
        y = torch.tensor([idx[g] for g, _, _ in lista], dtype=torch.long)
        return x, y

    xtr, ytr = tensores(treino)
    xte, yte = tensores(teste) if teste else (xtr[:0], ytr[:0])

    class Modelo(nn.Module):
        def __init__(self):
            super().__init__()
            self.entrada = nn.Sequential(nn.Linear(DIM, 128), nn.ReLU(), nn.Dropout(0.2))
            self.gru = nn.GRU(128, 128, batch_first=True, bidirectional=True)
            self.saida = nn.Linear(256, len(rotulos))

        def forward(self, x):  # x: [lote, 32, 132]
            h, _ = self.gru(self.entrada(x))
            return self.saida(h.mean(dim=1))

    modelo = Modelo()
    opt = torch.optim.AdamW(modelo.parameters(), lr=2e-3, weight_decay=1e-3)
    perda = nn.CrossEntropyLoss(label_smoothing=0.1)

    for epoca in range(1, args.epocas + 1):
        modelo.train()
        perm = torch.randperm(len(xtr))
        for i in range(0, len(xtr), 64):
            b = perm[i : i + 64]
            x = xtr[b]
            # aumento de dados: pequeno ruído e escala, simulando câmeras e pessoas diferentes
            x = x * (1 + 0.05 * torch.randn(x.shape[0], 1, 1)) + 0.01 * torch.randn_like(x)
            opt.zero_grad()
            l = perda(modelo(x), ytr[b])
            l.backward()
            opt.step()
        if epoca % 10 == 0 or epoca == args.epocas:
            modelo.eval()
            with torch.no_grad():
                acc_tr = (modelo(xtr).argmax(1) == ytr).float().mean().item()
                acc_te = (modelo(xte).argmax(1) == yte).float().mean().item() if len(xte) else float("nan")
            print(f"época {epoca:3d} | acurácia treino {acc_tr:.1%} | teste (pessoas novas) {acc_te:.1%}")

    args.saida.mkdir(parents=True, exist_ok=True)
    modelo.eval()
    exemplo = torch.zeros(1, QUADROS_NORMALIZADOS, DIM)
    torch.onnx.export(
        modelo, exemplo, args.saida / "sinalume.onnx",
        input_names=["sequencia"], output_names=["logits"],
        dynamic_axes={"sequencia": {0: "lote"}, "logits": {0: "lote"}}, opset_version=17,
    )
    (args.saida / "rotulos.json").write_text(json.dumps(rotulos, ensure_ascii=False), encoding="utf-8")
    print(f"Modelo salvo em {args.saida}/sinalume.onnx")
    return 0


if __name__ == "__main__":
    sys.exit(main())
