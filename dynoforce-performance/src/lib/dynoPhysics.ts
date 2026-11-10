import { heroRun } from '../config/siteConfig';

/** CV = Nm × rpm / 7023,5 (1 CV = 735,5 W). */
const NM_RPM_PER_CV = 7023.5;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Interpolação cúbica monótona (Fritsch–Carlson): curva suave, sem ondulação. */
function monotoneCurve(points: [number, number][]) {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

export interface EngineSpec {
  peakTorque: number;
  peakPower: number;
  peakPowerRpm: number;
  redline: number;
  /** Onde o turbo começa a encher e onde o torque chega ao platô. */
  spoolStart?: number;
  spoolEnd?: number;
  /** Fim do platô de torque. */
  knee?: number;
}

export interface EngineCurve {
  torque: (rpm: number) => number;
  power: (rpm: number) => number;
  spec: EngineSpec;
}

/**
 * Gera curvas de torque (Nm) e potência (CV) com o formato típico de um motor
 * turbo: subida rápida, platô de torque e queda suave no fim do giro. O topo é
 * ajustado para a potência de pico bater com o valor pedido.
 */
export function buildEngineCurve(spec: EngineSpec): EngineCurve {
  const { peakTorque: T, peakPower, peakPowerRpm, redline } = spec;
  const spoolStart = spec.spoolStart ?? 1700;
  const spoolEnd = spec.spoolEnd ?? 3200;
  const knee = spec.knee ?? 4600;
  let topTorque = (peakPower * NM_RPM_PER_CV) / peakPowerRpm;
  let torque = (_: number) => 0;

  for (let i = 0; i < 6; i++) {
    const end = ((topTorque * peakPowerRpm) / redline) * 0.965;
    torque = monotoneCurve([
      [800, T * 0.27],
      [spoolStart, T * 0.44],
      [(spoolStart + spoolEnd) / 2, T * 0.78],
      [spoolEnd, T * 0.985],
      [(spoolEnd + knee) / 2, T],
      [knee, T * 0.992],
      [peakPowerRpm, topTorque],
      [redline, end],
      [redline + 400, end * 0.9],
    ]);
    let best = 0;
    for (let r = knee; r <= redline; r += 25) best = Math.max(best, (torque(r) * r) / NM_RPM_PER_CV);
    topTorque *= peakPower / best;
  }

  const finalTorque = torque;
  return {
    torque: finalTorque,
    power: (rpm: number) => (finalTorque(rpm) * rpm) / NM_RPM_PER_CV,
    spec,
  };
}

export const heroEngine = buildEngineCurve({
  peakTorque: heroRun.peakTorque,
  peakPower: heroRun.peakPower,
  peakPowerRpm: heroRun.peakPowerRpm,
  redline: heroRun.redline,
});

/* ------------------------------------------------------------------ */
/* A puxada: tudo que a cena mostra é função do progresso (0 → 1).     */
/* ------------------------------------------------------------------ */

/** Marcos da puxada no eixo do progresso. Também definem os capítulos. */
export const RUN = {
  idleEnd: 0.14,
  powerStart: 0.44,
  pullEnd: 0.66,
  holdEnd: 0.74,
  coastEnd: 0.93,
} as const;

export const CHAPTERS = [
  { id: 'ignition', number: '01', title: 'IGNITION', start: 0 },
  { id: 'acceleration', number: '02', title: 'ACCELERATION', start: RUN.idleEnd },
  { id: 'power', number: '03', title: 'POWER', start: RUN.powerStart },
  { id: 'precision', number: '04', title: 'PRECISION', start: RUN.holdEnd },
] as const;

export interface DynoSample {
  /** Progresso da puxada, 0 → 1. */
  p: number;
  chapter: number;
  rpm: number;
  /** Velocidade nas rodas, km/h. */
  speed: number;
  /** Potência instantânea, CV. */
  power: number;
  /** Torque instantâneo, Nm. */
  torque: number;
  /** Pressão de turbo, bar. */
  boost: number;
  /** Temperatura do líquido de arrefecimento, °C. */
  temp: number;
  /** Carga do motor (acelerador), 0 → 1. */
  load: number;
  /** Quanto da oficina está acesa, 0 → 1. */
  energy: number;
  /** Emissão de fumaça, 0 → 1. */
  smoke: number;
  /** Intensidade do momento de pico, 0 → 1. */
  peak: number;
  /** Até que RPM o gráfico já foi desenhado. */
  chartRpm: number;
}

export function sampleRun(progress: number): DynoSample {
  const p = clamp01(progress);
  const { idleRpm, redline, topSpeed, peakBoost } = heroRun;

  const pull = clamp01((p - RUN.idleEnd) / (RUN.pullEnd - RUN.idleEnd));
  const pullEase = 0.3 * pull * pull * (3 - 2 * pull) + 0.7 * pull;
  const coast = clamp01((p - RUN.holdEnd) / (RUN.coastEnd - RUN.holdEnd));
  const coastEase = 1 - Math.pow(1 - coast, 2.2);

  let rpm: number;
  if (p <= RUN.pullEnd) rpm = lerp(idleRpm, redline, pullEase);
  else if (p <= RUN.holdEnd) rpm = redline;
  else rpm = lerp(redline, idleRpm, coastEase);

  const load = smoothstep(0, 0.1, pull) * (1 - smoothstep(RUN.holdEnd - 0.012, RUN.holdEnd + 0.012, p));
  const rpmNorm = (rpm - idleRpm) / (redline - idleRpm);

  const speed = topSpeed * Math.pow(rpmNorm, 0.92);
  const power = heroEngine.power(rpm) * load;
  const torque = heroEngine.torque(rpm) * load;
  const boost =
    peakBoost * smoothstep(1500, 3300, rpm) * (1 - 0.08 * smoothstep(5600, redline, rpm)) * load;
  const temp =
    86 + 19 * smoothstep(RUN.idleEnd, RUN.holdEnd, p) - 7 * smoothstep(RUN.holdEnd, 1, p);

  const peak =
    smoothstep(RUN.pullEnd - 0.1, RUN.pullEnd, p) * (1 - smoothstep(RUN.holdEnd, RUN.holdEnd + 0.05, p));
  const energy =
    0.06 +
    0.5 * smoothstep(RUN.idleEnd - 0.04, RUN.powerStart, p) +
    0.44 * smoothstep(RUN.powerStart, RUN.pullEnd, p) -
    0.15 * smoothstep(RUN.holdEnd, RUN.coastEnd, p);
  const smoke = load * smoothstep(2400, 5600, rpm);

  let chapter = 0;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (p >= CHAPTERS[i].start) {
      chapter = i;
      break;
    }
  }

  return {
    p,
    chapter,
    rpm,
    speed,
    power,
    torque,
    boost,
    temp,
    load,
    energy,
    smoke,
    peak,
    chartRpm: p >= RUN.pullEnd ? redline : rpm,
  };
}

/**
 * Pequena oscilação dos instrumentos: motor nenhum fica cravado num número.
 * Determinística no tempo, para HUD e áudio lerem o mesmo valor.
 */
export function liveRpm(sample: DynoSample, time: number): number {
  const idleWobble = (1 - sample.load) * (Math.sin(time * 5.1) * 14 + Math.sin(time * 12.7) * 7);
  const limiter = sample.peak > 0.98 ? Math.sin(time * 46) * 55 : 0;
  const loadWobble = sample.load * Math.sin(time * 23) * 9;
  return sample.rpm + idleWobble + limiter + loadWobble;
}

export const formatInt = (v: number) => Math.round(v).toLocaleString('pt-BR');
export const formatDec = (v: number, digits = 1) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
