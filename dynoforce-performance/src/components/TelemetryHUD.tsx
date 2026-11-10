import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { formatDec, formatInt, liveRpm } from '../lib/dynoPhysics';
import { dyno } from '../state/dynoStore';
import { RpmTape, type RpmTapeHandle } from './RpmTape';
import { SoundToggle } from './SoundToggle';

type Channel = 'rpm' | 'speed' | 'power' | 'torque' | 'boost' | 'temp';

const CHANNELS: { key: Channel; label: string; unit: string; compact: boolean }[] = [
  { key: 'rpm', label: 'RPM', unit: 'rpm', compact: true },
  { key: 'speed', label: 'Velocidade', unit: 'km/h', compact: false },
  { key: 'power', label: 'Potência', unit: 'CV', compact: true },
  { key: 'torque', label: 'Torque', unit: 'Nm', compact: true },
  { key: 'boost', label: 'Boost', unit: 'bar', compact: false },
  { key: 'temp', label: 'Temperatura', unit: '°C', compact: false },
];

const STATUS = ['Standby', 'Puxada em curso', 'Carga máxima', 'Desacelerando'];

interface TelemetryHUDProps {
  /** Só atualiza enquanto o hero está na tela. */
  active: boolean;
}

/**
 * Painel de telemetria sobre a cena. Os valores são escritos direto no DOM a
 * cada quadro (sem estado do React) e vêm do mesmo `dyno.sample` que move o
 * carro, a fumaça e o gráfico.
 */
export function TelemetryHUD({ active }: TelemetryHUDProps) {
  const values = useRef<Partial<Record<Channel, HTMLSpanElement | null>>>({});
  const tape = useRef<RpmTapeHandle>(null);
  const status = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const cache = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!active) return;
    const write = (key: string, element: HTMLElement | null | undefined, text: string) => {
      if (!element || cache.current[key] === text) return;
      cache.current[key] = text;
      element.textContent = text;
    };
    const update = (time: number) => {
      const sample = dyno.sample;
      const rpm = liveRpm(sample, time);
      const flutter = sample.load * Math.sin(time * 17);
      write('rpm', values.current.rpm, formatInt(Math.round(rpm / 10) * 10));
      write('speed', values.current.speed, formatInt(sample.speed));
      write('power', values.current.power, formatInt(sample.power + flutter * 1.5));
      write('torque', values.current.torque, formatInt(sample.torque + flutter * 2));
      write('boost', values.current.boost, formatDec(Math.max(0, sample.boost + flutter * 0.012), 2));
      write('temp', values.current.temp, formatInt(sample.temp));
      tape.current?.set(rpm / 7000);

      const phase = sample.peak > 0.6 ? 2 : sample.chapter === 2 ? 1 : sample.chapter;
      write('status', status.current, STATUS[phase]);
      const live = sample.load > 0.05;
      if (dot.current) dot.current.style.background = live ? 'var(--brand-accent)' : 'rgba(245,245,245,0.45)';
      if (root.current) root.current.style.setProperty('--hud-dim', live || sample.chapter === 3 ? '1' : '0.55');
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, [active]);

  return (
    <div
      ref={root}
      data-ui
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 gutter pb-4 lg:pb-6"
      aria-label="Telemetria de demonstração"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="tag flex items-center gap-2 text-ink">
          <i ref={dot} className="inline-block h-[7px] w-[7px] bg-ink/45" />
          <span ref={status}>Standby</span>
          <span className="hidden text-ink/50 sm:inline">· Dyno run</span>
        </p>
        <div className="flex items-center gap-4">
          <p className="tag text-right text-ink/60">
            Demonstração<span className="hidden md:inline">, não é medição real</span>
          </p>
          <SoundToggle />
        </div>
      </div>

      <RpmTape ref={tape} className="mt-3" />
      <div className="tag mt-[5px] hidden justify-between text-[9px] text-ink/40 lg:flex" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>

      <dl
        className="mt-3 grid grid-cols-3 gap-x-4 gap-y-3 transition-opacity duration-700 lg:mt-4 lg:grid-cols-6 lg:gap-x-8 lg:pr-[76px]"
        style={{ opacity: 'var(--hud-dim, 0.55)' }}
      >
        {CHANNELS.map((channel) => (
          <div key={channel.key} className={channel.compact ? '' : 'hidden lg:block'}>
            <dt className="tag text-[10px] text-ink/55 lg:text-[11px]">{channel.label}</dt>
            <dd className="num mt-1 flex items-baseline gap-[6px] font-medium leading-none text-ink">
              <span
                ref={(element) => {
                  values.current[channel.key] = element;
                }}
                className="text-[clamp(22px,2.3vw,38px)] tracking-[-0.04em]"
              >
                0
              </span>
              <span className="text-[11px] text-ink/50 lg:text-[12px]">{channel.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
