import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { brand, heroRun } from '../config/siteConfig';
import { drawDynoChart, fitCanvas } from '../lib/chartRenderer';
import { heroEngine, liveRpm } from '../lib/dynoPhysics';
import { dyno } from '../state/dynoStore';

interface LiveDynoChartProps {
  /** Só redesenha enquanto está visível. */
  active: boolean;
}

/**
 * Gráfico do hero: as curvas de potência e torque são traçadas no mesmo
 * instante em que o RPM sobe na cena — os dois leem o mesmo estado.
 */
export function LiveDynoChart({ active }: LiveDynoChartProps) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const draw = (time: number) => {
      const element = canvas.current;
      if (!element) return;
      const fitted = fitCanvas(element);
      if (!fitted) return;
      const sample = dyno.sample;
      const drawnTo = sample.chartRpm;
      const rpm = liveRpm(sample, time);
      drawDynoChart(fitted.ctx, fitted.width, fitted.height, {
        rpmMin: 1000,
        rpmMax: 7000,
        powerMax: 600,
        torqueMax: 750,
        accent: brand.colors.accent,
        series: [
          { fn: heroEngine.torque, axis: 'torque', color: '#f5f5f5', width: 2, drawnTo },
          { fn: heroEngine.power, axis: 'power', color: brand.colors.accent, width: 2.5, glow: true, drawnTo },
        ],
        marker:
          rpm > 1050
            ? {
                rpm: Math.min(rpm, heroRun.redline),
                labels: [
                  { value: heroEngine.power(rpm), unit: 'CV', color: brand.colors.accent, axis: 'power' },
                  { value: heroEngine.torque(rpm), unit: 'Nm', color: '#f5f5f5', axis: 'torque' },
                ],
              }
            : undefined,
      });
    };
    gsap.ticker.add(draw);
    return () => gsap.ticker.remove(draw);
  }, [active]);

  return (
    <div data-ui className="flex h-full flex-col bg-void/80 p-3 lg:p-4">
      <div className="mb-1 flex items-center justify-between gap-4 lg:mb-2">
        <p className="tag text-ink/80">Potência × torque</p>
        <p className="tag flex items-center gap-4 text-ink/60">
          <span className="flex items-center gap-2">
            <i className="inline-block h-[3px] w-4 bg-accent" /> CV
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block h-[3px] w-4 bg-ink" /> Nm
          </span>
        </p>
      </div>
      <canvas
        ref={canvas}
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label={`Gráfico de demonstração: potência até ${heroRun.peakPower} CV e torque até ${heroRun.peakTorque} Nm, de 1.000 a 7.000 rpm.`}
      />
    </div>
  );
}
