import { useEffect, useRef, useState } from 'react';
import { heroRun } from '../config/siteConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { formatInt } from '../lib/dynoPhysics';
import { useLoadState } from '../state/loadStore';
import { Logo } from './Logo';
import { RpmTape, type RpmTapeHandle } from './RpmTape';

/** Tempo máximo de espera pela cena 3D. Depois disso o site abre de qualquer jeito. */
const MAX_WAIT_MS = 16000;
const MIN_SHOW_MS = 1400;

const CHECKS = [
  { at: 0.12, label: 'ECU LINK' },
  { at: 0.34, label: 'ROLLERS' },
  { at: 0.58, label: 'SENSORS' },
  { at: 0.86, label: '3D MODEL' },
];

interface LoadingScreenProps {
  onDone: () => void;
}

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const { progress, status } = useLoadState();
  const reduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [checks, setChecks] = useState(0);

  const percent = useRef<HTMLSpanElement>(null);
  const rpm = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const tape = useRef<RpmTapeHandle>(null);
  const shown = useRef(0);
  const target = useRef(0);
  const startedAt = useRef(performance.now());
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const finished = status !== 'loading' || timedOut;
  target.current = finished ? 1 : progress * 0.96;

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // O número exibido persegue o progresso real, sem saltos.
  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const gap = target.current - shown.current;
      shown.current += gap * (1 - Math.exp(-dt * 5)) + Math.sign(gap) * Math.min(Math.abs(gap), dt * 0.05);
      if (Math.abs(target.current - shown.current) < 0.004) shown.current = target.current;
      const value = shown.current;

      if (percent.current) percent.current.textContent = String(Math.round(value * 100)).padStart(3, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${value})`;
      const revs = heroRun.idleRpm + (heroRun.redline - heroRun.idleRpm) * value + Math.sin(now / 90) * 18;
      if (rpm.current) rpm.current.textContent = formatInt(revs);
      tape.current?.set(revs / 7000);
      setChecks(CHECKS.filter((check) => value >= check.at).length);

      const waited = now - startedAt.current;
      if (value >= 1 && waited >= MIN_SHOW_MS) {
        setLeaving(true);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    doneRef.current();
    const timer = window.setTimeout(() => setGone(true), reduced ? 50 : 1100);
    return () => window.clearTimeout(timer);
  }, [leaving, reduced]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando a experiência"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-void gutter py-8 text-ink lg:py-12"
      style={{
        clipPath: leaving ? 'inset(0 0 100% 0)' : 'inset(0 0 0 0)',
        transition: reduced ? 'none' : 'clip-path 1s cubic-bezier(0.76, 0, 0.24, 1)',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <div className="flex items-start justify-between">
        <Logo />
        <ul className="hidden text-right sm:block" aria-hidden="true">
          {CHECKS.map((check, i) => (
            <li
              key={check.label}
              className="tag leading-[1.9] transition-colors duration-300"
              style={{ color: i < checks ? '#f5f5f5' : 'rgba(245,245,245,0.28)' }}
            >
              {check.label} <span className="ml-3 text-accent">{i < checks ? 'OK' : '··'}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="tag text-ink/60">
              RPM <span ref={rpm} className="ml-2 text-ink">900</span>
            </p>
            <p className="mt-3 font-display text-[clamp(22px,3.2vw,44px)] font-bold uppercase leading-none tracking-[-0.02em]">
              Initializing engine
              <span className="text-accent" style={{ animation: 'blink 1s steps(2) infinite' }}>
                _
              </span>
            </p>
          </div>
          <p className="num text-[clamp(56px,13vw,190px)] font-medium leading-[0.8] tracking-[-0.06em]">
            <span ref={percent}>000</span>
            <span className="text-[0.32em] text-ink/50">%</span>
          </p>
        </div>

        <RpmTape ref={tape} className="mt-7" />
        <div className="mt-[6px] h-[3px] bg-ink/12">
          <div ref={bar} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
        </div>
        {timedOut && status === 'loading' && (
          <p className="tag mt-3 text-ink/60">Conexão lenta — a cena 3D termina de carregar em segundo plano.</p>
        )}
      </div>
    </div>
  );
}
