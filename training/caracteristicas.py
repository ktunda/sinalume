"""Vetor de características por quadro — IDÊNTICO a src/lib/maos.ts (função vetorizar).

Se mudar aqui, mude lá também (e vice-versa); os testes em test_caracteristicas.py conferem o tamanho.
Layout: [mão direita (21 pontos x 3, posição x, posição y, presença), mão esquerda (idem)] = 132 valores.
"""
from __future__ import annotations

import math
from typing import Optional, Sequence

PONTOS = 21
POR_MAO = PONTOS * 3 + 3
DIM = 2 * POR_MAO
QUADROS_NORMALIZADOS = 32

Ponto = Sequence[float]  # (x, y, z) normalizados 0..1, como o MediaPipe devolve


def _mao(pontos: Optional[Sequence[Ponto]], saida: list[float]) -> None:
    if pontos is None:
        saida.extend([0.0] * POR_MAO)
        return
    px, py, pz = pontos[0]
    mx, my, mz = pontos[9]
    escala = math.sqrt((mx - px) ** 2 + (my - py) ** 2 + (mz - pz) ** 2) or 1.0
    for x, y, z in pontos:
        saida.extend([(x - px) / escala, (y - py) / escala, (z - pz) / escala])
    saida.extend([(px - 0.5) * 2, (py - 0.5) * 2, 1.0])


def vetorizar(direita: Optional[Sequence[Ponto]], esquerda: Optional[Sequence[Ponto]]) -> list[float]:
    v: list[float] = []
    _mao(direita, v)
    _mao(esquerda, v)
    return v


def reamostrar(seq: Sequence[Sequence[float]], n: int = QUADROS_NORMALIZADOS) -> list[list[float]]:
    """Interpolação linear para n quadros — igual a reamostrar() em src/lib/reconhecedor.ts."""
    if not seq:
        return []
    if len(seq) == 1:
        return [list(seq[0]) for _ in range(n)]
    saida = []
    for i in range(n):
        pos = i * (len(seq) - 1) / (n - 1)
        a = int(math.floor(pos))
        b = min(a + 1, len(seq) - 1)
        f = pos - a
        saida.append([va * (1 - f) + vb * f for va, vb in zip(seq[a], seq[b])])
    return saida


def aparar(seq: list[list[float]]) -> list[list[float]]:
    """Remove quadros sem nenhuma mão no início e no fim do vídeo."""
    tem_mao = [q[POR_MAO - 1] > 0 or q[DIM - 1] > 0 for q in seq]
    if not any(tem_mao):
        return []
    ini = tem_mao.index(True)
    fim = len(tem_mao) - tem_mao[::-1].index(True)
    return seq[ini:fim]
