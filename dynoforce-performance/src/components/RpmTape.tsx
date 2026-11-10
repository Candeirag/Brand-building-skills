import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface RpmTapeHandle {
  /** Preenche a fita até `fraction` (0 → 1). */
  set: (fraction: number) => void;
}

interface RpmTapeProps {
  segments?: number;
  /** Fração a partir da qual os segmentos são da faixa vermelha. */
  redlineFrom?: number;
  className?: string;
}

/**
 * Fita de rotação segmentada, como a barra de LEDs de um volante de corrida.
 * Duas camadas idênticas: a de baixo apagada, a de cima acesa e recortada por
 * `clip-path` — um único estilo muda por quadro.
 */
export const RpmTape = forwardRef<RpmTapeHandle, RpmTapeProps>(function RpmTape(
  { segments = 48, redlineFrom = 6 / 7, className = '' },
  ref,
) {
  const lit = useRef<HTMLDivElement>(null);
  const last = useRef(-1);

  useImperativeHandle(ref, () => ({
    set(fraction) {
      const stepped = Math.round(Math.min(1, Math.max(0, fraction)) * segments) / segments;
      if (stepped === last.current || !lit.current) return;
      last.current = stepped;
      lit.current.style.clipPath = `inset(0 ${(1 - stepped) * 100}% 0 0)`;
    },
  }));

  const cells = Array.from({ length: segments }, (_, i) => i / segments >= redlineFrom);
  const layer = (on: boolean) =>
    cells.map((red, i) => (
      <i
        key={i}
        className={
          on
            ? red
              ? 'bg-accent'
              : 'bg-ink'
            : red
              ? 'bg-accent/25'
              : 'bg-ink/15'
        }
      />
    ));
  const grid = { gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` };

  return (
    <div className={`relative h-[10px] ${className}`} aria-hidden="true">
      <div className="absolute inset-0 grid gap-[2px] lg:gap-[3px]" style={grid}>
        {layer(false)}
      </div>
      <div
        ref={lit}
        className="absolute inset-0 grid gap-[2px] lg:gap-[3px]"
        style={{ ...grid, clipPath: 'inset(0 100% 0 0)' }}
      >
        {layer(true)}
      </div>
    </div>
  );
});
