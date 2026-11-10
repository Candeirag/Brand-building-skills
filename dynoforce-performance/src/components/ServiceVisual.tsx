import { useEffect, useRef, useState } from 'react';
import { brand, brandImage, type ServiceItem } from '../config/siteConfig';
import { drawDynoChart, fitCanvas } from '../lib/chartRenderer';
import { afterCurve as after, beforeCurve as before } from '../lib/comparison';
import { formatDec } from '../lib/dynoPhysics';

const RPM_COLUMNS = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500];
const LOAD_ROWS = [160, 140, 120, 100, 80, 60, 40, 20];

/** Avanço de ignição plausível: sobe com a rotação, cai com a carga. */
const advance = (rpm: number, load: number) => 8 + (rpm / 1000) * 3.4 - (load / 160) * 15;
/** Células "reescritas" pela calibração: carga alta, na faixa de torque. */
const isTuned = (rpm: number, load: number) => load >= 100 && rpm >= 2500 && rpm <= 6000;

/** Mapa de ignição: o artefato real de um remap é uma tabela como esta. */
function MapTable() {
  return (
    <div data-ui className="flex h-full flex-col bg-graphite p-4 lg:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="tag text-ink">Mapa de ignição · ° APMS</p>
        <p className="tag text-ink/50">Exemplo</p>
      </div>
      <table className="num mt-4 h-full w-full table-fixed border-separate border-spacing-[2px] text-[9px] sm:text-[10px] lg:text-[11px]">
        <caption className="sr-only">
          Mapa de ignição de exemplo: avanço em graus por rotação e carga do motor.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="w-[9%] text-left font-normal text-ink/45">
              kPa
            </th>
            {RPM_COLUMNS.map((rpm) => (
              <th key={rpm} scope="col" className="font-normal text-ink/45">
                {rpm / 1000}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LOAD_ROWS.map((load, row) => (
            <tr key={load}>
              <th scope="row" className="text-left font-normal text-ink/45">
                {load}
              </th>
              {RPM_COLUMNS.map((rpm, column) => {
                const tuned = isTuned(rpm, load);
                return (
                  <td
                    key={rpm}
                    className={`text-center ${tuned ? 'bg-accent text-on-accent' : 'bg-ink/[0.06] text-ink/70'}`}
                    style={
                      tuned
                        ? { animation: `blink 2.6s ${(column * 0.09 + row * 0.13).toFixed(2)}s ease-in-out infinite` }
                        : undefined
                    }
                  >
                    {formatDec(advance(rpm, load) + (tuned ? 2.5 : 0), 1)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tag mt-3 text-ink/50">RPM ×1000 · células em destaque: faixa recalibrada</p>
    </div>
  );
}

const CHANNELS = [
  { label: 'Lambda', unit: 'λ', base: 0.98, swing: 0.02, digits: 2, min: 0.7, max: 1.2 },
  { label: 'Avanço', unit: '°', base: 14.5, swing: 1.2, digits: 1, min: 0, max: 30 },
  { label: 'Temp. admissão', unit: '°C', base: 38, swing: 1.5, digits: 0, min: 0, max: 80 },
  { label: 'Pressão do rail', unit: 'bar', base: 142, swing: 6, digits: 0, min: 0, max: 200 },
  { label: 'Correção de detonação', unit: '°', base: 0.4, swing: 0.4, digits: 1, min: 0, max: 6 },
  { label: 'Bateria', unit: 'V', base: 14.1, swing: 0.1, digits: 1, min: 10, max: 16 },
];

/** Leitura de parâmetros em tempo real, como na tela de um scanner. */
function DiagnosticReadout({ animate }: { animate: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 520);
    return () => window.clearInterval(timer);
  }, [animate]);

  return (
    <div data-ui className="flex h-full flex-col bg-graphite p-4 lg:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="tag text-ink">Parâmetros em tempo real</p>
        <p className="tag text-ink/50">Exemplo</p>
      </div>
      <dl className="mt-4 flex flex-1 flex-col justify-between gap-3">
        {CHANNELS.map((channel, index) => {
          const value = channel.base + Math.sin(tick * 1.7 + index * 2.1) * channel.swing;
          const fill = (value - channel.min) / (channel.max - channel.min);
          return (
            <div key={channel.label}>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[13px] text-ink/75 lg:text-[14px]">{channel.label}</dt>
                <dd className="num text-[15px] text-ink lg:text-[17px]">
                  {formatDec(value, channel.digits)}
                  <span className="ml-1 text-[11px] text-ink/50">{channel.unit}</span>
                </dd>
              </div>
              <div className="mt-[6px] h-[4px] bg-ink/10">
                <div
                  className="h-full origin-left bg-accent transition-transform duration-500 ease-out"
                  style={{ transform: `scaleX(${Math.min(1, Math.max(0.02, fill))})` }}
                />
              </div>
            </div>
          );
        })}
      </dl>
      <p className="tag mt-4 text-ink">
        <span className="text-accent">0</span> falhas ativas · <span className="text-ink/50">1 no histórico</span>
      </p>
    </div>
  );
}

/** Stage 1 em uma imagem: a mesma curva, antes e depois. */
function GainChart() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const draw = () => {
      const fitted = fitCanvas(element);
      if (!fitted) return;
      drawDynoChart(fitted.ctx, fitted.width, fitted.height, {
        rpmMin: 1000,
        rpmMax: 7000,
        powerMax: 500,
        torqueMax: 625,
        accent: brand.colors.accent,
        compact: true,
        gainFill: { from: before.power, to: after.power, color: brand.colors.accent, opacity: 0.2 },
        series: [
          { fn: before.power, axis: 'power', color: '#f5f5f5', dashed: true, opacity: 0.6, width: 1.75 },
          { fn: after.power, axis: 'power', color: brand.colors.accent, width: 2.5, glow: true },
        ],
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts.ready.then(draw);
    return () => observer.disconnect();
  }, []);

  return (
    <div data-ui className="flex h-full flex-col bg-graphite p-4 lg:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="tag text-ink">Potência · original × Stage 1</p>
        <p className="tag text-ink/50">Exemplo</p>
      </div>
      <canvas
        ref={canvas}
        className="mt-3 min-h-0 w-full flex-1"
        role="img"
        aria-label="Gráfico de exemplo: curva de potência original e curva após o Stage 1, com a área de ganho destacada."
      />
    </div>
  );
}

const IMAGES: Partial<Record<ServiceItem['visual'], { src: string; alt: string }>> = {
  rollers: {
    src: brandImage('render-rollers.jpg'),
    alt: 'Roda traseira do carro apoiada entre os dois rolos do dinamômetro.',
  },
  stage2: {
    src: brandImage('render-rear.jpg'),
    alt: 'Traseira do carro com as três saídas de escape centrais e o difusor.',
  },
  custom: {
    src: brandImage('render-front.jpg'),
    alt: 'Frente do carro em três quartos, sob a luz da oficina.',
  },
};

interface ServiceVisualProps {
  visual: ServiceItem['visual'];
  /** Anima só quando está à vista. */
  active?: boolean;
}

export function ServiceVisual({ visual, active = true }: ServiceVisualProps) {
  if (visual === 'map') return <MapTable />;
  if (visual === 'diagnostic') return <DiagnosticReadout animate={active} />;
  if (visual === 'stage1') return <GainChart />;
  const image = IMAGES[visual]!;
  return (
    <div className="h-full overflow-hidden bg-graphite">
      <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}
