import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { useFinePointer } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Detalhe de desktop: um conta-giros em miniatura segue o cursor. O arco sobe
 * com a velocidade do ponteiro e da rolagem e cai sozinho, como um motor que
 * volta para a marcha lenta. O cursor do sistema continua visível.
 */
export function RpmCursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const ring = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!fine || reduced) return;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const position = { ...target };
    let revs = 0;
    let lastScroll = window.scrollY;
    let hovering = false;
    let shown = false;

    const onMove = (event: PointerEvent) => {
      revs = Math.min(1, revs + Math.hypot(event.movementX, event.movementY) / 420);
      target.x = event.clientX;
      target.y = event.clientY;
      hovering = (event.target as Element | null)?.closest?.('a, button, input, select, textarea, [role="group"]') != null;
      if (!shown) {
        shown = true;
        position.x = target.x;
        position.y = target.y;
        if (ring.current) ring.current.style.opacity = '1';
      }
    };
    const onLeave = () => {
      shown = false;
      if (ring.current) ring.current.style.opacity = '0';
    };

    const tick = (_: number, deltaMs: number) => {
      const dt = Math.min(0.05, deltaMs / 1000);
      const scroll = window.scrollY;
      revs = Math.min(1, revs + Math.abs(scroll - lastScroll) / 900);
      lastScroll = scroll;
      revs *= Math.exp(-dt * 2.4);
      const k = 1 - Math.exp(-dt * 16);
      position.x += (target.x - position.x) * k;
      position.y += (target.y - position.y) * k;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${hovering ? 1.5 : 1})`;
      }
      // Arco de 270°, como um mostrador.
      if (arc.current) {
        arc.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - 0.75 * (0.08 + 0.92 * revs)));
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      gsap.ticker.remove(tick);
    };
  }, [fine, reduced]);

  if (!fine || reduced) return null;

  return (
    <div
      ref={ring}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] opacity-0 mix-blend-difference transition-opacity duration-300"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" className="rotate-[135deg]">
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          stroke="rgba(245,245,245,0.3)"
          strokeWidth="2"
          strokeDasharray={`${CIRCUMFERENCE * 0.75} ${CIRCUMFERENCE}`}
        />
        <circle
          ref={arc}
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          stroke="#f5f5f5"
          strokeWidth="2.5"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>
    </div>
  );
}
