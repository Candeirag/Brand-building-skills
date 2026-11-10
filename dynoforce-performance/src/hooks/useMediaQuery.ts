import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Layout de celular e tablet em pé. */
export const useIsCompact = () => useMediaQuery('(max-width: 1023px)');
/** Dispositivo com mouse de verdade. */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');
