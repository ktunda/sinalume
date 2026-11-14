"""Testes rápidos (sem MediaPipe): python -m pytest training/ ou python training/test_caracteristicas.py"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from caracteristicas import DIM, QUADROS_NORMALIZADOS, aparar, reamostrar, vetorizar  # noqa: E402


def mao(dx=0.0):
    return [(0.5 + dx + i * 0.01, 0.5 + (0.05 if i == 9 else i * 0.005), 0.0) for i in range(21)]


def test_dim():
    assert DIM == 132
    assert len(vetorizar(mao(), None)) == DIM
    assert len(vetorizar(None, None)) == DIM


def test_reamostrar():
    r = reamostrar([[0.0], [9.0]], 4)
    assert len(r) == 4 and r[0] == [0.0] and r[-1] == [9.0]


def test_aparar_remove_quadros_sem_mao():
    vazio = vetorizar(None, None)
    cheio = vetorizar(mao(), None)
    assert len(aparar([vazio, cheio, cheio, vazio])) == 2


def test_gerar_pacote():
    with tempfile.TemporaryDirectory() as d:
        pontos = Path(d) / "pontos.jsonl"
        with pontos.open("w", encoding="utf-8") as f:
            for g in ["ÁGUA", "agua", "DEUS", "OUTRO"]:
                f.write(json.dumps({"glosa": g, "sinalizante": "1", "arquivo": g,
                                    "quadros": [vetorizar(mao(i * 0.01), None) for i in range(10)]}) + "\n")
        glosas = Path(d) / "g.txt"
        glosas.write_text("Água\nDeus\nPAZ\n", encoding="utf-8")
        saida = Path(d) / "p.json"
        r = subprocess.run([sys.executable, str(Path(__file__).parent / "gerar_pacote.py"), "--pontos", str(pontos),
                            "--saida", str(saida), "--glosas", str(glosas)], capture_output=True, text=True)
        assert r.returncode == 0, r.stderr
        p = json.loads(saida.read_text(encoding="utf-8"))
        assert p["formato"] == "sinalume-exemplos" and p["dim"] == DIM
        assert {e["glosa"] for e in p["exemplos"]} == {"ÁGUA", "DEUS"}
        assert len(p["exemplos"]) == 3  # ÁGUA + agua (mesma glosa) + DEUS
        assert all(len(e["quadros"]) == QUADROS_NORMALIZADOS for e in p["exemplos"])
        assert "PAZ" in r.stdout  # avisa o que falta gravar


if __name__ == "__main__":
    for nome, f in list(globals().items()):
        if nome.startswith("test_"):
            f()
            print("ok", nome)
