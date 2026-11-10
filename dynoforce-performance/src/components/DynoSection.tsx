import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { brand, dynoComparison } from '../config/siteConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { chartGeometry, drawDynoChart, fitCanvas, type ChartOptions } from '../lib/chartRenderer';
import { afterCurve, beforeCurve } from '../lib/comparison';
import { formatInt, lerp } from '../lib/dynoPhysics';
import { Heading } from './Heading';

const RPM_MIN = 1000;
const RPM_MAX = 7000;
const { before, after } = dynoComparison;
const gainPercent = (from: number, to: number) => Math.round(((to - from) / from) * 100);

export function DynoSection() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const power = useRef<HTMLSpanElement>(null);
  const torque = useRef<HTMLSpanElement>(null);
  const mix = useRef({ value: 0 });
  const rpmRef = useRef(4500);
  const reduced = useReducedMotion();

  const [showAfter, setShowAfter] = useState(false);
  const [rpm, setRpm] = useState(4500);
  rpmRef.current = rpm;

  const draw = useCallback(() => {
    const element = canvas.current;
    if (!element) return;
    const fitted = fitCanvas(element);
    if (!fitted) return;
    const m = mix.current.value;
    const accent = brand.colors.accent;
    const currentPower = (r: number) => lerp(beforeCurve.power(r), afterCurve.power(r), m);
    const currentTorque = (r: number) => lerp(beforeCurve.torque(r), afterCurve.torque(r), m);
    const r = rpmRef.current;

    const options: ChartOptions = {
      rpmMin: RPM_MIN,
      rpmMax: RPM_MAX,
      powerMax: 500,
      torqueMax: 625,
      accent,
      gainFill: { from: beforeCurve.power, to: currentPower, color: accent, opacity: 0.2 * m },
      series: [
        { fn: beforeCurve.torque, axis: 'torque', color: '#f5f5f5', dashed: true, opacity: 0.35 * m, width: 1.5 },
        { fn: beforeCurve.power, axis: 'power', color: accent, dashed: true, opacity: 0.55 * m, width: 1.5 },
        { fn: currentTorque, axis: 'torque', color: '#f5f5f5', width: 2.25 },
        { fn: currentPower, axis: 'power', color: accent, width: 3, glow: true },
      ],
      marker: {
        rpm: r,
        labels: [
          { value: currentPower(r), unit: 'CV', color: accent, axis: 'power' },
          { value: currentTorque(r), unit: 'Nm', color: '#f5f5f5', axis: 'torque' },
        ],
      },
    };
    drawDynoChart(fitted.ctx, fitted.width, fitted.height, options);

    if (power.current) power.current.textContent = formatInt(lerp(before.power, after.power, m));
    if (torque.current) torque.current.textContent = formatInt(lerp(before.torque, after.torque, m));
  }, []);

  // Transição ANTES → DEPOIS: as curvas e os números sobem juntos.
  useEffect(() => {
    const tween = gsap.to(mix.current, {
      value: showAfter ? 1 : 0,
      duration: reduced ? 0 : 1.5,
      ease: 'power3.inOut',
      onUpdate: draw,
    });
    return () => {
      tween.kill();
    };
  }, [showAfter, reduced, draw]);

  useEffect(draw, [rpm, draw]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts.ready.then(draw);
    return () => observer.disconnect();
  }, [draw]);

  // Ao entrar na tela pela primeira vez, revela o DEPOIS sozinho.
  useEffect(() => {
    if (!section.current) return;
    const trigger = ScrollTrigger.create({
      trigger: canvas.current,
      start: 'top 62%',
      once: true,
      onEnter: () => setShowAfter(true),
    });
    return () => trigger.kill();
  }, []);

  const onPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const element = canvas.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const geometry = chartGeometry(rect.width, rect.height, {
      rpmMin: RPM_MIN,
      rpmMax: RPM_MAX,
    } as ChartOptions);
    const value = geometry.rpmAt(event.clientX - rect.left);
    setRpm(Math.round(Math.min(dynoComparison.redline, Math.max(1200, value)) / 50) * 50);
  };

  const beforeAt = beforeCurve.power(rpm);
  const afterAt = afterCurve.power(rpm);

  return (
    <section
      id="dinamometro"
      ref={section}
      aria-labelledby="dyno-titulo"
      className="bg-graphite py-[120px] lg:py-[200px]"
    >
      <div className="gutter grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Heading
            id="dyno-titulo"
            lines={['Numbers', 'don’t lie.']}
            className="text-[clamp(44px,12.4vw,80px)] lg:text-[clamp(54px,6.1vw,116px)]"
          />
          <p data-reveal className="mt-7 max-w-[24em] text-[18px] text-ink lg:mt-10 lg:text-[21px]">
            Cada curva conta uma história. Cada ajuste é validado por dados.
          </p>

          <div data-reveal className="mt-10 lg:mt-14">
            <div role="group" aria-label="Comparar antes e depois" className="inline-flex bg-void p-1">
              {[
                { label: 'Antes', value: false },
                { label: 'Depois', value: true },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={showAfter === option.value}
                  onClick={() => setShowAfter(option.value)}
                  className={`min-h-[48px] min-w-[112px] px-6 font-display text-[14px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 ${
                    showAfter === option.value
                      ? 'bg-accent text-on-accent'
                      : 'text-ink/65 hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <dl className="mt-9 grid grid-cols-2 gap-6">
              {[
                { label: 'Potência', unit: 'CV', ref: power, from: before.power, to: after.power },
                { label: 'Torque', unit: 'Nm', ref: torque, from: before.torque, to: after.torque },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[15px] text-ink/70">{item.label}</dt>
                  <dd className="num mt-1 text-[clamp(44px,5.4vw,92px)] font-medium leading-none tracking-[-0.06em] text-ink">
                    <span ref={item.ref}>{item.from}</span>
                    <span className="ml-2 font-display text-[0.3em] font-bold tracking-normal text-ink/60">
                      {item.unit}
                    </span>
                  </dd>
                  <dd
                    className={`num mt-3 text-[15px] text-accent transition-opacity duration-700 lg:text-[17px] ${
                      showAfter ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    +{item.to - item.from} {item.unit} · +{gainPercent(item.from, item.to)}%
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div data-reveal data-ui className="lg:col-span-7">
          <div className="bg-void p-4 lg:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="tag text-ink">Dyno sheet · {showAfter ? 'original × acertado' : 'original'}</p>
              <p className="tag flex items-center gap-4 text-ink/60">
                <span className="flex items-center gap-2">
                  <i className="inline-block h-[3px] w-4 bg-accent" /> Potência (CV)
                </span>
                <span className="flex items-center gap-2">
                  <i className="inline-block h-[3px] w-4 bg-ink" /> Torque (Nm)
                </span>
              </p>
            </div>
            <canvas
              ref={canvas}
              onPointerMove={onPointer}
              onPointerDown={onPointer}
              className="mt-4 aspect-[4/3] w-full cursor-crosshair touch-pan-y sm:aspect-[16/10]"
              role="img"
              aria-label={`Gráfico ilustrativo de dinamômetro. Antes: ${before.power} CV e ${before.torque} Nm. Depois: ${after.power} CV e ${after.torque} Nm.`}
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <label htmlFor="dyno-rpm" className="tag shrink-0 text-ink/70">
                Ler a curva em
              </label>
              <input
                id="dyno-rpm"
                type="range"
                min={1200}
                max={dynoComparison.redline}
                step={50}
                value={rpm}
                onChange={(event) => setRpm(Number(event.target.value))}
                aria-valuetext={`${formatInt(rpm)} rpm`}
                className="h-8 w-full cursor-pointer accent-[var(--brand-accent)]"
              />
            </div>
            <p className="num mt-3 text-[14px] text-ink lg:text-[15px]" aria-live="polite">
              {formatInt(rpm)} rpm: antes {formatInt(beforeAt)} CV · depois {formatInt(afterAt)} CV ·{' '}
              <span className="text-accent">+{formatInt(afterAt - beforeAt)} CV</span>
            </p>
          </div>
          <p className="mt-4 text-[14px] text-ink/60">
            Dados ilustrativos, para demonstração do relatório. Não representam a medição de um
            veículo específico.
          </p>
        </div>
      </div>
    </section>
  );
}
