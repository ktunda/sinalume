"""Extrai os pontos das mãos de vídeos de sinais (V-LIBRASIL, MINDS-Libras ou gravações próprias).

Saída: um arquivo pontos.jsonl com uma linha por vídeo: {"glosa", "sinalizante", "arquivo", "quadros": [[132 valores], ...]}
Só os pontos são guardados — os vídeos não são copiados nem redistribuídos.

Uso:
  python extrair_pontos.py --videos ./V-LIBRASIL --saida pontos.jsonl \
      --regex-glosa "^(?P<glosa>[^_]+)_(?P<sinalizante>\\d+)"

Por padrão a glosa é o nome da pasta do vídeo. Use --regex-glosa quando a glosa estiver no nome do arquivo
(ajuste a expressão ao padrão de nomes da versão do dataset que você baixou).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

from caracteristicas import aparar, vetorizar

MODELO_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
)
EXTENSOES = {".mp4", ".avi", ".mov", ".mkv", ".webm"}


def baixar_modelo(destino: Path) -> Path:
    if not destino.exists():
        print(f"Baixando modelo de mãos do MediaPipe para {destino}…")
        urllib.request.urlretrieve(MODELO_URL, destino)
    return destino


def criar_detector(modelo: Path):
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode

    opcoes = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(modelo)),
        running_mode=RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    return mp, HandLandmarker.create_from_options(opcoes)


def processar_video(caminho: Path, mp, detector, fps_alvo: float = 15.0) -> list[list[float]]:
    import cv2

    cap = cv2.VideoCapture(str(caminho))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    passo = max(1, round(fps / fps_alvo))  # mesma taxa do app (~15 quadros/s)
    quadros: list[list[float]] = []
    i = 0
    t_ms = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if i % passo == 0:
            # reduz para 640 px de largura, como a câmera do app
            h, w = frame.shape[:2]
            if w > 640:
                frame = cv2.resize(frame, (640, int(h * 640 / w)))
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            imagem = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            t_ms = int(i * 1000 / fps)
            r = detector.detect_for_video(imagem, t_ms)
            direita = esquerda = None
            for pontos, lado in zip(r.hand_landmarks, r.handedness):
                xyz = [(p.x, p.y, p.z) for p in pontos]
                if lado[0].category_name == "Left":
                    esquerda = xyz
                else:
                    direita = xyz
            quadros.append(vetorizar(direita, esquerda))
        i += 1
    cap.release()
    return aparar(quadros)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--videos", required=True, type=Path, help="pasta com os vídeos (busca recursiva)")
    ap.add_argument("--saida", default=Path("pontos.jsonl"), type=Path)
    ap.add_argument("--regex-glosa", help="regex com grupos (?P<glosa>…) e opcionalmente (?P<sinalizante>…)")
    ap.add_argument("--modelo", default=Path("hand_landmarker.task"), type=Path)
    args = ap.parse_args()

    videos = sorted(p for p in args.videos.rglob("*") if p.suffix.lower() in EXTENSOES)
    if not videos:
        print("Nenhum vídeo encontrado.", file=sys.stderr)
        return 1
    padrao = re.compile(args.regex_glosa) if args.regex_glosa else None
    ja_feitos = set()
    if args.saida.exists():
        ja_feitos = {json.loads(l)["arquivo"] for l in args.saida.open(encoding="utf-8")}

    mp, detector = criar_detector(baixar_modelo(args.modelo))
    with args.saida.open("a", encoding="utf-8") as out:
        for n, v in enumerate(videos, 1):
            rel = str(v.relative_to(args.videos))
            if rel in ja_feitos:
                continue
            if padrao:
                m = padrao.search(v.stem)
                if not m:
                    print(f"[pulado] nome fora do padrão: {rel}")
                    continue
                glosa = m.group("glosa")
                sinalizante = m.groupdict().get("sinalizante") or "?"
            else:
                glosa, sinalizante = v.parent.name, "?"
            quadros = processar_video(v, mp, detector)
            if len(quadros) < 4:
                print(f"[pulado] mãos não detectadas: {rel}")
                continue
            registro = {
                "glosa": glosa.upper().replace(" ", "-"),
                "sinalizante": sinalizante,
                "arquivo": rel,
                "quadros": [[round(x, 4) for x in q] for q in quadros],
            }
            out.write(json.dumps(registro, ensure_ascii=False) + "\n")
            print(f"[{n}/{len(videos)}] {registro['glosa']} ({len(quadros)} quadros)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
