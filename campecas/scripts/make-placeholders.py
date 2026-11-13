"""Gera os placeholders de public/media (claquetes de storyboard, a sequência
antes→depois e os quadros do vídeo de faíscas do hero).

Uso:  python3 scripts/make-placeholders.py scripts/fonts [frames-dir]
Depois, para o vídeo:
  ffmpeg -y -framerate 24 -i <frames-dir>/%04d.jpg -c:v libx264 -pix_fmt yuv420p \
         -crf 27 -preset slow -movflags +faststart -an public/media/hero.mp4

Tudo aqui é provisório: troque cada arquivo pela foto ou vídeo real descrito em
public/media/MEDIA.md, mantendo o mesmo nome.
"""
import math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTS = sys.argv[1]
FRAMES = sys.argv[2] if len(sys.argv) > 2 else None
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'media')
os.makedirs(OUT, exist_ok=True)
RED = (191, 26, 44)
INK = (237, 233, 227)
rng = np.random.default_rng(7)

def anton(size): return ImageFont.truetype(os.path.join(FONTS, 'Anton-Regular.ttf'), size)
def inter(size, weight=500):
    f = ImageFont.truetype(os.path.join(FONTS, 'InterTight[wght].ttf'), size)
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    return f

def save(img, name, q=82):
    img.convert('RGB').save(os.path.join(OUT, name), quality=q, optimize=True, progressive=True)
    print('ok', name)

def grain(arr, amount=5.0):
    return np.clip(arr + rng.normal(0, amount, arr.shape[:2])[..., None], 0, 255)

def vignette(w, h, strength=0.55):
    y, x = np.mgrid[0:h, 0:w]
    d = np.hypot((x - w / 2) / (w / 2), (y - h / 2) / (h / 2))
    return np.clip(1 - strength * np.clip(d - 0.35, 0, None) ** 1.6, 0, 1)[..., None]

# ---------------------------------------------------------------- claquetes
def slate(name, scene, title, note, size=(1600, 1000), light=(0.72, 0.3), tint=(1.0, 0.96, 0.92), tag=None, bright=1.0):
    w, h = size
    y, x = np.mgrid[0:h, 0:w]
    lx, ly = light[0] * w, light[1] * h
    d = np.hypot((x - lx) / w, (y - ly) / h)
    base = 13 + 58 * np.exp(-(d / 0.34) ** 2) * bright
    # reflexo de luz de cabine: faixas horizontais suaves, como num capô
    base += 16 * bright * np.exp(-((y / h - 0.62) / 0.012) ** 2) * np.clip(1 - np.abs(x / w - 0.5) * 1.5, 0, 1)
    base += 9 * bright * np.exp(-((y / h - 0.7) / 0.03) ** 2) * np.clip(1 - np.abs(x / w - 0.45) * 1.7, 0, 1)
    arr = np.stack([base * tint[0], base * tint[1], base * tint[2]], -1) * vignette(w, h)
    img = Image.fromarray(grain(arr, 4).astype('uint8'))
    dr = ImageDraw.Draw(img, 'RGBA')
    u = w / 1600
    m = int(56 * u)
    # título fantasma, enorme
    f = anton(int(h * 0.42))
    tw = dr.textlength(title, font=f)
    if tw > w * 0.94: f = anton(int(h * 0.42 * w * 0.94 / tw))
    dr.text((m - 6 * u, h * 0.5), title, font=f, fill=(44, 44, 46, 255), anchor='lm')
    # marcas de enquadramento nos cantos
    L = int(34 * u)
    for cx, cy, sx, sy in [(m, m, 1, 1), (w - m, m, -1, 1), (m, h - m, 1, -1), (w - m, h - m, -1, -1)]:
        dr.line([(cx, cy), (cx + sx * L, cy)], fill=INK + (150,), width=max(2, int(2 * u)))
        dr.line([(cx, cy), (cx, cy + sy * L)], fill=INK + (150,), width=max(2, int(2 * u)))
    # faixa de claquete
    sw, sh = int(44 * u), int(20 * u)
    for i in range(9):
        x0 = m + L + int(18 * u) + i * sw
        dr.polygon([(x0, m - sh // 2), (x0 + sw // 2, m - sh // 2), (x0 + sw // 2 - sh, m + sh // 2), (x0 - sh, m + sh // 2)], fill=INK + (215,))
    dr.text((w - m - L - 18 * u, m), scene, font=inter(int(22 * u), 600), fill=INK + (230,), anchor='rm')
    # bloco de informação
    by = h - m - int(150 * u)
    dr.rectangle([m + L, by, m + L + int(6 * u), by + int(118 * u)], fill=RED + (255,))
    tx = m + L + int(26 * u)
    dr.text((tx, by - 4 * u), 'PLACEHOLDER · TROCAR PELA MÍDIA REAL', font=inter(int(19 * u), 600), fill=INK + (170,))
    dr.text((tx, by + 26 * u), name, font=anton(int(54 * u)), fill=INK + (255,))
    f2 = inter(int(23 * u), 500)
    words, line, lines = note.split(), '', []
    for wd in words:
        if dr.textlength(line + ' ' + wd, font=f2) > w * 0.62 and line: lines.append(line); line = wd
        else: line = (line + ' ' + wd).strip()
    lines.append(line)
    for i, ln in enumerate(lines[:2]): dr.text((tx, by + (94 + i * 30) * u), ln, font=f2, fill=INK + (205,))
    if tag:
        f3 = anton(int(74 * u)); tw = dr.textlength(tag, font=f3)
        dr.rectangle([w - m - L - tw - 40 * u, h - m - L - 96 * u, w - m - L, h - m - L], fill=(RED if tag == 'DEPOIS' else (40, 40, 42)) + (255,))
        dr.text((w - m - L - 20 * u, h - m - L - 48 * u), tag, font=f3, fill=INK + (255,), anchor='rm')
    save(img, name)

# ------------------------------------------------- sequência antes → depois
def panel(stage, size=(1920, 1200)):
    """Macro de uma porta de carro, renderizada com normais e um ambiente de cabine."""
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    x, y = xx / w, yy / h
    asp = w / h
    # normais da chapa: curvatura vertical + vinco de estilo
    nx = (x - 0.5) * 0.10
    ny = (y - 0.47) * 1.15 + 0.22 * np.tanh((y - 0.34) / 0.012) - 0.10 * np.tanh((y - 0.80) / 0.02)
    dent_c, sig = (0.40, 0.58), 0.085
    dx, dy = (x - dent_c[0]) * asp, y - dent_c[1]
    g = np.exp(-(dx * dx + dy * dy) / (2 * sig * sig))
    dent_amp = {1: 1.0, 2: 0.0, 3: 0.0, 4: 0.0}[stage]
    nx = nx + dent_amp * 1.5 * dx / sig * g
    ny = ny + dent_amp * 1.5 * dy / sig * g
    # vinco agudo dentro do amassado
    crease = np.exp(-((dy + 0.35 * dx + 0.01) / 0.006) ** 2) * np.exp(-(dx / 0.11) ** 2)
    ny = ny + dent_amp * 0.9 * crease
    noise = lambda s, blur: np.asarray(Image.fromarray((rng.random((h // s, w // s)) * 255).astype('uint8')).resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(blur)), dtype=float) / 255 - 0.5
    rough = {1: 0.10, 2: 0.10, 3: 0.035, 4: 0.004}[stage]
    nx = nx + noise(2, 0.6) * rough; ny = ny + noise(2, 0.6) * rough
    nz = np.ones_like(nx)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz); nx, ny, nz = nx / ln, ny / ln, nz / ln
    # reflexão do olhar (0,0,1)
    rx, ry = 2 * nz * nx, -2 * nz * ny  # ry > 0 aponta para o teto
    blur = {1: 0.42, 2: 0.42, 3: 0.11, 4: 0.016}[stage]
    env = np.zeros_like(rx)
    for cy, wd, amp in [(0.34, 0.035, 1.0), (0.52, 0.03, 0.85), (0.74, 0.05, 0.5)]:
        s = math.hypot(wd, blur)
        env += amp * (wd / s) * np.exp(-((ry - cy) / s) ** 2) * (0.35 + 0.65 * np.exp(-((rx + 0.02) / (0.5 + blur)) ** 2))
    env += 0.05 * np.clip(ry + 0.2, 0, 1)
    env *= np.clip(0.55 + 0.45 * np.tanh((ry + 0.05) / (0.04 + blur)), 0, 1)  # o piso escuro reflete embaixo
    ldir = np.array([-0.35, -0.55, 0.76]); ldir /= np.linalg.norm(ldir)
    diff = np.clip(nx * ldir[0] + ny * ldir[1] + nz * ldir[2], 0, 1)
    # albedo
    red = np.array([150, 16, 30], float)
    alb = np.ones((h, w, 3)) * red
    if stage == 1:
        blot = noise(40, 22) * 2
        alb = alb * (0.62 + 0.25 * blot[..., None]) + np.array([40, 34, 34])  # tinta queimada de sol
        sc = Image.new('L', (w, h), 0); d = ImageDraw.Draw(sc)
        r = random.Random(3)
        for _ in range(46):
            cx = int((dent_c[0] + r.gauss(0, 0.13)) * w); cy = int((dent_c[1] + r.gauss(0, 0.1)) * h)
            L = r.uniform(40, 260) * w / 1920; a = r.gauss(-0.3, 0.25)
            d.line([(cx - L * math.cos(a), cy - L * math.sin(a)), (cx + L * math.cos(a), cy + L * math.sin(a))], fill=r.randint(90, 230), width=r.choice([1, 1, 2, 3]))
        s = np.asarray(sc.filter(ImageFilter.GaussianBlur(0.7)), float)[..., None] / 255
        alb = alb * (1 - s) + np.array([176, 170, 166]) * s
    if stage == 2:
        blob = np.exp(-((dx / 0.23) ** 2 + (dy / 0.2) ** 2) ** 1.6)
        m = np.clip((blob + noise(30, 14) * 0.5 - 0.32) * 9, 0, 1)[..., None]
        primer = np.array([150, 150, 148]) * (1 + 0.5 * noise(3, 1.2)[..., None])
        alb = (alb * 0.72 + np.array([30, 26, 26])) * (1 - m) + primer * m
        swirl = np.sin(np.hypot(dx, dy) * 900 + noise(60, 30) * 40) * 0.5 + 0.5
        alb = alb * (1 - 0.10 * m * swirl[..., None])
        tape = ((np.abs(x - 0.775) < 0.012) | (np.abs(y - 0.30) < 0.011))[..., None]
        alb = np.where(tape, np.array([196, 178, 132]) * (0.9 + 0.2 * noise(4, 1)[..., None]), alb)
        kraft = (x > 0.787)[..., None]
        alb = np.where(kraft, np.array([138, 110, 78]) * (0.85 + 0.35 * noise(12, 5)[..., None]), alb)
    spec = {1: 0.10, 2: 0.07, 3: 0.55, 4: 1.25}[stage]
    amb = {1: 0.42, 2: 0.46, 3: 0.34, 4: 0.20}[stage]
    col = alb * (amb + 0.62 * diff)[..., None] + (env * spec * 255)[..., None] * np.array([1.0, 0.97, 0.93])
    if stage == 2:
        mm = np.clip((np.exp(-((dx / 0.23) ** 2 + (dy / 0.2) ** 2) ** 1.6) - 0.3) * 9, 0, 1)[..., None]
        col = col * (1 - mm) + (alb * (0.55 + 0.5 * diff)[..., None]) * mm
    if stage != 2:  # vão da porta
        gap = np.exp(-((x - 0.775) / 0.0016) ** 2)[..., None]
        col = col * (1 - 0.85 * gap)
    if stage == 4:  # brilho estrelado no ponto mais quente
        star = np.exp(-(((x - 0.33) * asp) ** 2 + (y - 0.335) ** 2) / 0.00006) * 255
        col = col + star[..., None]
    col = col * vignette(w, h, 0.5)
    return Image.fromarray(grain(col, 3.5).astype('uint8'))

# ------------------------------------------------------------ vídeo do hero
def hero_frames(folder, w=1280, h=720, fps=24, seconds=6):
    os.makedirs(folder, exist_ok=True)
    T = seconds; n = fps * seconds
    r = random.Random(11)
    ex, ey = 0.70 * w, 0.66 * h
    sparks = []
    for _ in range(1500):
        ang = math.radians(r.gauss(203, 13)); sp = r.uniform(360, 1250)
        sparks.append((r.uniform(0, T), r.uniform(0.35, 1.25), sp * math.cos(ang), sp * math.sin(ang), r.uniform(0.6, 1.0), r.random() < 0.12))
    yy, xx = np.mgrid[0:h, 0:w]
    base = 7 + 30 * np.exp(-(np.hypot((xx - 0.62 * w) / w, (yy - 0.2 * h) / h) / 0.42) ** 2)
    base += 15 * np.exp(-((yy / h - 0.74) / 0.016) ** 2) * np.clip(1 - np.abs(xx / w - 0.55) * 1.3, 0, 1)   # borda da chapa
    base = np.where(yy / h > 0.745, base * 0.55 + 3, base)
    bg = np.stack([base * 1.0, base * 0.96, base * 0.93], -1)
    vg = vignette(w, h, 0.7)
    for i in range(n):
        t = i / fps
        layer = Image.new('RGB', (w, h), (0, 0, 0)); d = ImageDraw.Draw(layer)
        for t0, life, vx, vy, br, bounce in sparks:
            age = (t - t0) % T
            if age > life: continue
            def pos(a):
                px = ex + vx * a * (1 - 0.28 * a); py = ey + vy * a + 620 * a * a
                floor = 0.745 * h
                if py > floor: py = floor - (py - floor) * (0.35 if bounce else 0.0)
                return px, py
            k = 1 - age / life
            a0 = max(0.0, age - 0.035 - 0.02 * k)
            p0, p1 = pos(a0), pos(age)
            heat = k ** 0.7 * br
            c = (int(255 * min(1, heat * 1.5)), int(205 * heat ** 1.3), int(120 * heat ** 2.6))
            d.line([p0, p1], fill=c, width=2 if k > 0.45 else 1)
        core = 150 + 60 * math.sin(t * 2 * math.pi * 4 / T * 3)   # o ponto do disco pulsa (periódico em T)
        d.ellipse([ex - 7, ey - 7, ex + 7, ey + 7], fill=(255, 240, 210))
        arr = np.asarray(layer, float)
        glow = np.asarray(layer.filter(ImageFilter.GaussianBlur(9)), float) * 1.6 + np.asarray(layer.filter(ImageFilter.GaussianBlur(42)), float) * 2.4
        sweep = 0.5 + 0.5 * math.sin(2 * math.pi * t / T)        # a luz ambiente respira com as faíscas
        halo = np.exp(-(np.hypot(xx - ex, yy - ey) / (190 + core * 0.3)) ** 2)[..., None] * np.array([70, 38, 14]) * (0.8 + 0.2 * sweep)
        out = (bg * (0.9 + 0.12 * sweep) + arr + glow + halo) * vg
        Image.fromarray(grain(out, 3).astype('uint8')).save(os.path.join(folder, f'{i + 1:04d}.jpg'), quality=90)
    print('frames', n)
    Image.open(os.path.join(folder, f'{int(n * 0.4):04d}.jpg')).save(os.path.join(OUT, 'hero-poster.jpg'), quality=80, optimize=True, progressive=True)

if __name__ == '__main__':
    names = ['01-amassado', '02-preparado', '03-pintado', '04-polido']
    for i, nm in enumerate(names, 1): save(panel(i), f'transformacao-{nm}.jpg', 84)
    slate('lanternagem.jpg', 'CENA 04 · CAP. 01', 'LANTERNAGEM', 'Mãos alinhando uma lateral com martelo e tasso. Luz dura vinda de um lado, fundo escuro.', light=(0.7, 0.32))
    slate('pintura.jpg', 'CENA 04 · CAP. 02', 'PINTURA', 'Pintor de costas na cabine, pistola em ação, névoa de tinta contra a luz.', light=(0.5, 0.18), tint=(1.0, 0.9, 0.88))
    slate('mecanica.jpg', 'CENA 04 · CAP. 03', 'MECÂNICA', 'Capô aberto, mãos no motor com lanterna. Detalhe fechado, sem rosto.', light=(0.3, 0.4), tint=(0.94, 0.97, 1.0))
    slate('pecas.jpg', 'CENA 04 · CAP. 04', 'PEÇAS', 'Prateleira ou bancada com peças novas alinhadas. Plano frontal, simétrico.', light=(0.55, 0.5))
    cars = ['Lateral traseira', 'Para-choque dianteiro', 'Porta do motorista', 'Capô', 'Para-lama', 'Tampa traseira']
    for i, c in enumerate(cars, 1):
        slate(f'trabalho-{i:02d}-antes.jpg', f'GALERIA · {i:02d}', 'ANTES', f'{c} como chegou. Mesmo ângulo e mesma distância da foto do depois.', size=(1400, 1050), light=(0.3, 0.3), tint=(0.92, 0.92, 0.95), tag='ANTES', bright=0.6)
        slate(f'trabalho-{i:02d}-depois.jpg', f'GALERIA · {i:02d}', 'DEPOIS', f'{c} entregue, com reflexo da luz na pintura. Mesmo ângulo do antes.', size=(1400, 1050), light=(0.68, 0.3), tag='DEPOIS', bright=1.25)
    slate('familia.jpg', 'CENA 08 · QUEM FAZ', 'FAMÍLIA', 'Retrato de quem toca a oficina, na frente dela ou junto de um carro pronto. Luz natural.', size=(1400, 1750), light=(0.5, 0.3), tint=(1.0, 0.95, 0.88), bright=1.2)
    # cartão de compartilhamento
    w, h = 1200, 630
    img = panel(4, (w, h)); arr = np.asarray(img, float) * 0.42
    img = Image.fromarray(arr.astype('uint8')); d = ImageDraw.Draw(img)
    d.text((64, 250), 'DO AMASSADO', font=anton(150), fill=INK, anchor='lm'); d.text((64, 410), 'AO ESPELHADO.', font=anton(150), fill=INK, anchor='lm')
    d.rectangle([64, 520, 70, 566], fill=RED); d.text((88, 543), 'CAMPEÇAS · Lanternagem, pintura e mecânica · DF', font=inter(30, 600), fill=INK, anchor='lm')
    save(img, 'og.jpg', 84)
    # grão de filme (ladrilho)
    g = rng.normal(128, 46, (220, 220)).clip(0, 255).astype('uint8')
    Image.merge('LA', [Image.fromarray(g), Image.fromarray(np.full((220, 220), 255, 'uint8'))]).save(os.path.join(OUT, '..', 'grain.png'), optimize=True)
    if FRAMES: hero_frames(FRAMES)
