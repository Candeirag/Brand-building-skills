import { useSyncExternalStore } from 'react';

/**
 * Carregamento da cena 3D. `progress` vai de 0 a 1:
 * o código da cena conta até 0,2; os assets (GLB, texturas, decodificador)
 * levam até 0,95; o primeiro quadro com o carro fecha em 1.
 */
export type LoadStatus = 'loading' | 'ready' | 'failed' | 'skipped';

interface LoadState {
  progress: number;
  status: LoadStatus;
}

let state: LoadState = { progress: 0, status: 'loading' };
const listeners = new Set<() => void>();

function set(next: Partial<LoadState>) {
  const merged = { ...state, ...next };
  if (merged.progress === state.progress && merged.status === state.status) return;
  state = merged;
  listeners.forEach((fn) => fn());
}

export const loadStore = {
  get: () => state,
  setProgress: (progress: number) => {
    if (state.status === 'loading') set({ progress: Math.max(state.progress, Math.min(1, progress)) });
  },
  setStatus: (status: LoadStatus) => set({ status, progress: status === 'ready' ? 1 : state.progress }),
};

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const useLoadState = () => useSyncExternalStore(subscribe, loadStore.get);
