import { formatInt } from './dynoPhysics';

/**
 * Desenho do gráfico de dinamômetro em Canvas 2D: grade técnica, dois eixos
 * (CV à esquerda, Nm à direita), curvas com brilho discreto e marcador do RPM.
 * Usado pelo HUD do hero (curva sendo traçada) e pela comparação antes/depois.
 */
export interface ChartSeries {
  /** Valor da curva em função do RPM. */
  fn: (rpm: number) => number;
  axis: 'power' | 'torque';
  color: string;
  width?: number;
  dashed?: boolean;
  glow?: boolean;
  /** Até que RPM a curva está desenhada (padrão: até o fim). */
  drawnTo?: number;
  opacity?: number;
}

export interface ChartOptions {
  rpmMin: number;
  rpmMax: number;
  powerMax: number;
  torqueMax: number;
  series: ChartSeries[];
  /** Área preenchida entre duas curvas de potência (o ganho). */
  gainFill?: { from: (rpm: number) => number; to: (rpm: number) => number; color: string; opacity: number };
  /** Linha vertical no RPM atual, com os valores lidos em cada curva. */
  marker?: { rpm: number; labels: { value: number; unit: string; color: string; axis: 'power' | 'torque' }[] };
  compact?: boolean;
  accent: string;
}

export interface ChartGeometry {
  left: number;
  right: number;
  top: number;
  bottom: number;
  x: (rpm: number) => number;
  rpmAt: (px: number) => number;
}

const MONO = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';
const GRID = 'rgba(245,245,245,0.075)';
const GRID_STRONG = 'rgba(245,245,245,0.16)';
const LABEL = 'rgba(245,245,245,0.55)';

export function chartGeometry(width: number, height: number, options: ChartOptions): ChartGeometry {
  const compact = options.compact ?? width < 420;
  const left = compact ? 38 : 52;
  const right = width - (compact ? 38 : 52);
  const top = compact ? 14 : 20;
  const bottom = height - (compact ? 26 : 34);
  const span = options.rpmMax - options.rpmMin;
  return {
    left,
    right,
    top,
    bottom,
    x: (rpm) => left + ((rpm - options.rpmMin) / span) * (right - left),
    rpmAt: (px) => options.rpmMin + ((px - left) / (right - left)) * span,
  };
}

export function drawDynoChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: ChartOptions,
) {
  const compact = options.compact ?? width < 420;
  const g = chartGeometry(width, height, options);
  const plotH = g.bottom - g.top;
  const yPower = (v: number) => g.bottom - (v / options.powerMax) * plotH;
  const yTorque = (v: number) => g.bottom - (v / options.torqueMax) * plotH;
  const fontSize = compact ? 9 : 11;

  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.font = `500 ${fontSize}px ${MONO}`;

  // Grade vertical: a cada 500 rpm, forte a cada 1000.
  for (let rpm = Math.ceil(options.rpmMin / 500) * 500; rpm <= options.rpmMax; rpm += 500) {
    const x = Math.round(g.x(rpm)) + 0.5;
    const major = rpm % 1000 === 0;
    ctx.strokeStyle = major ? GRID_STRONG : GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, g.top);
    ctx.lineTo(x, g.bottom);
    ctx.stroke();
    if (major) {
      ctx.fillStyle = LABEL;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(rpm / 1000), x, g.bottom + (compact ? 6 : 9));
    }
  }

  // Grade horizontal: cinco faixas, rotuladas nos dois eixos.
  const rows = 5;
  for (let i = 0; i <= rows; i++) {
    const y = Math.round(g.bottom - (i / rows) * plotH) + 0.5;
    ctx.strokeStyle = i === 0 ? GRID_STRONG : GRID;
    ctx.beginPath();
    ctx.moveTo(g.left, y);
    ctx.lineTo(g.right, y);
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = LABEL;
    ctx.textAlign = 'right';
    ctx.fillText(formatInt((options.powerMax * i) / rows), g.left - 8, y);
    ctx.textAlign = 'left';
    ctx.fillText(formatInt((options.torqueMax * i) / rows), g.right + 8, y);
  }

  // Nomes dos eixos.
  ctx.fillStyle = LABEL;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('CV', g.left - (compact ? 30 : 40), g.top - (compact ? 12 : 16));
  ctx.textAlign = 'right';
  ctx.fillText('Nm', g.right + (compact ? 30 : 40), g.top - (compact ? 12 : 16));
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('×1000', g.left - 8, g.bottom + (compact ? 6 : 9));

  const step = Math.max(20, (options.rpmMax - options.rpmMin) / Math.max(60, (g.right - g.left) / 3));

  if (options.gainFill && options.gainFill.opacity > 0.01) {
    const fill = options.gainFill;
    ctx.beginPath();
    for (let rpm = options.rpmMin; rpm <= options.rpmMax; rpm += step) {
      const x = g.x(rpm);
      const y = yPower(fill.to(rpm));
      if (rpm === options.rpmMin) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let rpm = options.rpmMax; rpm >= options.rpmMin; rpm -= step) {
      ctx.lineTo(g.x(rpm), yPower(fill.from(rpm)));
    }
    ctx.closePath();
    ctx.globalAlpha = fill.opacity;
    ctx.fillStyle = fill.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (const series of options.series) {
    const end = Math.min(series.drawnTo ?? options.rpmMax, options.rpmMax);
    if (end <= options.rpmMin + 1) continue;
    const y = series.axis === 'power' ? yPower : yTorque;
    ctx.beginPath();
    let first = true;
    for (let rpm = options.rpmMin; rpm < end; rpm += step) {
      const px = g.x(rpm);
      const py = y(series.fn(rpm));
      if (first) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      first = false;
    }
    ctx.lineTo(g.x(end), y(series.fn(end)));
    ctx.globalAlpha = series.opacity ?? 1;
    ctx.strokeStyle = series.color;
    ctx.lineWidth = series.width ?? 2.25;
    ctx.setLineDash(series.dashed ? [5, 6] : []);
    if (series.glow) {
      ctx.shadowColor = series.color;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  if (options.marker) {
    const rpm = Math.min(Math.max(options.marker.rpm, options.rpmMin), options.rpmMax);
    const x = Math.round(g.x(rpm)) + 0.5;
    ctx.strokeStyle = 'rgba(245,245,245,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x, g.top);
    ctx.lineTo(x, g.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    const flip = x > (g.left + g.right) / 2;
    ctx.font = `600 ${fontSize + 1}px ${MONO}`;
    ctx.textBaseline = 'middle';
    let lastY = -Infinity;
    const labels = [...options.marker.labels]
      .map((label) => ({
        ...label,
        y: label.axis === 'power' ? yPower(label.value) : yTorque(label.value),
      }))
      .sort((a, b) => a.y - b.y);
    for (const label of labels) {
      ctx.fillStyle = label.color;
      ctx.beginPath();
      ctx.arc(x, label.y, compact ? 3 : 4, 0, Math.PI * 2);
      ctx.fill();
      const textY = Math.max(label.y, lastY + fontSize + 5);
      lastY = textY;
      const text = `${formatInt(label.value)} ${label.unit}`;
      const tw = ctx.measureText(text).width;
      const tx = flip ? x - 10 - tw : x + 10;
      ctx.fillStyle = 'rgba(5,5,5,0.82)';
      ctx.fillRect(tx - 4, textY - fontSize / 2 - 3, tw + 8, fontSize + 6);
      ctx.fillStyle = label.color;
      ctx.textAlign = 'left';
      ctx.fillText(text, tx, textY + 0.5);
    }

    // Etiqueta do RPM, presa ao eixo.
    const rpmText = formatInt(rpm);
    ctx.font = `600 ${fontSize}px ${MONO}`;
    const rw = ctx.measureText(rpmText).width + 10;
    const rx = Math.min(Math.max(x - rw / 2, g.left), g.right - rw);
    ctx.fillStyle = options.accent;
    ctx.fillRect(rx, g.bottom + 3, rw, fontSize + 7);
    ctx.fillStyle = '#050505';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(rpmText, rx + rw / 2, g.bottom + 6.5);
  }
}

/** Ajusta o canvas ao tamanho do elemento e à densidade de pixels. */
export function fitCanvas(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; width: number; height: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}
