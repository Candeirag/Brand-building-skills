"""Gera brand.ts, os SVGs da logo e o ícone a partir dos caminhos vetorizados."""
import json
import sys

paths = json.load(open(sys.argv[1]))
root = sys.argv[2]  # pasta campecas-checkin

RED, BLUE, GRAY, DEEP = "#EC3237", "#36478D", "#312F30", "#1C2340"

FULL = (2, 6, 622, 260)  # carro + MINEIROCAR + AUTO CENTER
WORD = (2, 153, 622, 113)  # MINEIROCAR + AUTO CENTER
MARK = (97, 7, 464, 138)  # carro com a chave


def colors(tone):
    dark = tone == "dark"
    return {
        "mark": RED,
        "word_blue": "#FFFFFF" if dark else BLUE,
        "word_red": RED,
        "sub": "#FFFFFF" if dark else GRAY,
    }


def svg(view, parts, tone, label="MINEIROCAR Auto Center"):
    c = colors(tone)
    body = "".join(f'<path fill="{c[k]}" d="{paths[k]["d"]}"/>' for k in parts)
    vb = " ".join(str(v) for v in view)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{view[2]}" height="{view[3]}" '
        f'role="img" aria-label="{label}">{body}</svg>\n'
    )


ALL = ["mark", "word_blue", "word_red", "sub"]
WORDS = ["word_blue", "word_red", "sub"]
files = {
    "public/logo-mineirocar.svg": svg(FULL, ALL, "light"),
    "public/logo-mineirocar-escuro.svg": svg(FULL, ALL, "dark"),
    "public/logo-mineirocar-horizontal.svg": svg(WORD, WORDS, "light"),
    "public/logo-mineirocar-horizontal-escuro.svg": svg(WORD, WORDS, "dark"),
    "public/simbolo-mineirocar.svg": svg(MARK, ["mark"], "light"),
}

# Ícone quadrado: símbolo vermelho sobre o azul-escuro da marca.
iw = 52
ih = iw * MARK[3] / MARK[2]
files["src/app/icon.svg"] = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="{DEEP}"/>'
    f'<svg x="{(64 - iw) / 2:.2f}" y="{(64 - ih) / 2:.2f}" width="{iw}" height="{ih:.2f}" viewBox="{" ".join(map(str, MARK))}">'
    f'<path fill="{RED}" d="{paths["mark"]["d"]}"/></svg></svg>\n'
)

ts = f'''/*
 * Logo da MINEIROCAR Auto Center, vetorizada a partir da imagem enviada pela oficina
 * (potrace, uma camada por cor). Gerado por scripts/logo/gerar_logo.py: não edite à mão.
 *
 * Na tela, a logo vem dos SVGs em /public (cache do navegador). Estes caminhos servem
 * ao PDF e ao ícone do app, que são desenhados no servidor.
 */
export const BRAND_RED = "{RED}";
export const BRAND_BLUE = "{BLUE}";
export const BRAND_GRAY = "{GRAY}";
/** Azul-escuro das superfícies escuras (cabeçalho do laudo, painel do login, ícone). */
export const BRAND_DEEP = "{DEEP}";

/** Logo completa: carro + MINEIROCAR + AUTO CENTER. */
export const LOGO_VIEWBOX = [{", ".join(map(str, FULL))}] as const;
/** Versão horizontal: MINEIROCAR + AUTO CENTER (cabeçalhos). */
export const WORDMARK_VIEWBOX = [{", ".join(map(str, WORD))}] as const;
/** Símbolo: carro com a chave. */
export const MARK_VIEWBOX = [{", ".join(map(str, MARK))}] as const;

export const LOGO_LAYERS = {{
  /** Carro com a chave (vermelho). */
  mark: {json.dumps(paths["mark"]["d"])},
  /** "MINEIRO" (azul). */
  wordBlue: {json.dumps(paths["word_blue"]["d"])},
  /** "CAR" (vermelho). */
  wordRed: {json.dumps(paths["word_red"]["d"])},
  /** "AUTO CENTER" (grafite). */
  subtitle: {json.dumps(paths["sub"]["d"])},
}} as const;
'''
files["src/lib/brand.ts"] = ts

for rel, content in files.items():
    with open(f"{root}/{rel}", "w") as fh:
        fh.write(content)
    print(f"{rel}: {len(content) // 1024} KB")
