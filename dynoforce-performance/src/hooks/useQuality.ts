import { useMemo } from 'react';
import { useIsCompact } from './useMediaQuery';
import { useReducedMotion } from './useReducedMotion';

export interface Quality {
  tier: 'high' | 'low';
  /** Teto de densidade de pixels do canvas. */
  maxDpr: number;
  smokeCount: number;
  dustCount: number;
  /** Bloom, distorção de calor, vinheta e grão. */
  postprocessing: boolean;
  /** Piso espelhado (renderiza a cena uma segunda vez). */
  reflections: boolean;
  shadows: boolean;
}

/**
 * Escolhe o nível gráfico pelo aparelho. Celulares e máquinas modestas recebem
 * menos partículas, sem pós-processamento e sem piso espelhado.
 */
export function useQuality(): Quality {
  const compact = useIsCompact();
  const reduced = useReducedMotion();
  return useMemo(() => {
    const forced = new URLSearchParams(window.location.search).get('quality');
    const cores = navigator.hardwareConcurrency ?? 4;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const low = forced === 'low' || (forced !== 'high' && (compact || touch || cores <= 4));
    if (low) {
      return {
        tier: 'low',
        maxDpr: 1.5,
        smokeCount: reduced ? 28 : 64,
        dustCount: 90,
        postprocessing: false,
        reflections: false,
        shadows: false,
      };
    }
    return {
      tier: 'high',
      maxDpr: 1.75,
      smokeCount: reduced ? 60 : 200,
      dustCount: 260,
      postprocessing: true,
      reflections: true,
      shadows: true,
    };
  }, [compact, reduced]);
}
