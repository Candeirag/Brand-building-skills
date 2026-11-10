"""Vetoriza a logo MINEIROCAR (JPG) em caminhos SVG por cor e por parte.

Uso (precisa de numpy, Pillow e potracer: pip install numpy pillow potracer):
    python3 scripts/logo/vetorizar.py scripts/logo/logo-original.jpg /tmp/paths.json
    python3 scripts/logo/gerar_logo.py /tmp/paths.json .
"""
import json
import sys

import numpy as np
import potrace
from PIL import Image, ImageFilter

SRC = sys.argv[1]
OUT = sys.argv[2]
S = 6  # fator de ampliação antes do traçado

BG = np.array([247, 247, 247], float)
RED = np.array([236, 50, 55], float)
BLUE = np.array([54, 71, 141], float)
GRAY = np.array([49, 47, 48], float)

img = Image.open(SRC).convert("RGB")
W, H = img.size
big = img.resize((W * S, H * S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(S * 0.35))
a = np.asarray(big).astype(float)


def ink(color):
    v = color - BG
    return ((a - BG) * v).sum(-1) / (v * v).sum()


t_red, t_blue, t_gray = ink(RED), ink(BLUE), ink(GRAY)
d = lambda c: ((a - c) ** 2).sum(-1)
nearest_red_vs_blue = d(RED) < d(BLUE)

rows = np.arange(H * S)[:, None] / S
band_mark = (rows >= 4) & (rows < 150)
band_word = (rows >= 150) & (rows < 227)
band_sub = rows >= 227

masks = {
    "mark": (t_red > 0.5) & band_mark,
    "word_blue": (t_blue > 0.5) & ~nearest_red_vs_blue & band_word,
    "word_red": (t_red > 0.5) & nearest_red_vs_blue & band_word,
    "sub": (t_gray > 0.5) & band_sub,
}


def fmt(x):
    return f"{x / S:.1f}".rstrip("0").rstrip(".")


def to_path(mask):
    bm = potrace.Bitmap(~mask)
    plist = bm.trace(turdsize=S * S * 2, alphamax=1.0, opticurve=True, opttolerance=0.4)
    parts = []
    for curve in plist:
        sp = curve.start_point
        seg = [f"M{fmt(sp.x)} {fmt(sp.y)}"]
        for s in curve.segments:
            if s.is_corner:
                seg.append(f"L{fmt(s.c.x)} {fmt(s.c.y)}L{fmt(s.end_point.x)} {fmt(s.end_point.y)}")
            else:
                seg.append(
                    f"C{fmt(s.c1.x)} {fmt(s.c1.y)} {fmt(s.c2.x)} {fmt(s.c2.y)} {fmt(s.end_point.x)} {fmt(s.end_point.y)}"
                )
        seg.append("Z")
        xs = [p.x for p in [sp] + [q.end_point for q in curve.segments]]
        ys = [p.y for p in [sp] + [q.end_point for q in curve.segments]]
        if (max(xs) - min(xs)) * (max(ys) - min(ys)) / (S * S) < 12:
            continue  # resíduo do JPEG
        parts.append("".join(seg))
    return "".join(parts)


def bbox(mask):
    ys, xs = np.where(mask)
    return [xs.min() / S, ys.min() / S, (xs.max() + 1) / S, (ys.max() + 1) / S]


result = {k: {"d": to_path(m), "bbox": bbox(m)} for k, m in masks.items()}
json.dump(result, open(OUT, "w"))
for k, v in result.items():
    print(k, [round(x, 1) for x in v["bbox"]], len(v["d"]), "chars")
