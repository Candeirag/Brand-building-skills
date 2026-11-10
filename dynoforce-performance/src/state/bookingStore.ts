import { useSyncExternalStore } from 'react';
import { scrollToTarget } from '../animations/scrollAnimations';

/** Serviço pré-selecionado no formulário quando o visitante clica em "Agendar" num serviço. */
let requested: string | null = null;
const listeners = new Set<() => void>();

export function requestService(title: string) {
  requested = title;
  listeners.forEach((fn) => fn());
  scrollToTarget('#contato');
}

export const useRequestedService = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => requested,
  );
