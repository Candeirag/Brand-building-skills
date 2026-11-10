import { useSyncExternalStore } from 'react';
import { sampleRun, type DynoSample } from '../lib/dynoPhysics';

/**
 * Estado da puxada, fora do React de propósito: a cena 3D, o HUD, o gráfico e
 * o áudio leem `dyno.sample` a cada quadro sem provocar renderizações.
 * Só a troca de capítulo e alguns interruptores passam pelo React.
 */
interface DynoState {
  progress: number;
  sample: DynoSample;
  chapter: number;
  /** A reprodução automática está rolando a página. */
  autoplay: boolean;
  /** O som do motor está ligado. */
  sound: boolean;
  /** A tela de carregamento já saiu. */
  entered: boolean;
  /** Posição do ponteiro, -1 → 1, para o paralaxe da câmera. */
  pointerX: number;
  pointerY: number;
}

export const dyno: DynoState = {
  progress: 0,
  sample: sampleRun(0),
  chapter: 0,
  autoplay: false,
  sound: false,
  entered: false,
  pointerX: 0,
  pointerY: 0,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export function setProgress(progress: number) {
  dyno.progress = progress;
  dyno.sample = sampleRun(progress);
  if (dyno.sample.chapter !== dyno.chapter) {
    dyno.chapter = dyno.sample.chapter;
    emit();
  }
}

export function setFlag(key: 'autoplay' | 'sound' | 'entered', value: boolean) {
  if (dyno[key] === value) return;
  dyno[key] = value;
  emit();
}

export const useChapter = () => useSyncExternalStore(subscribe, () => dyno.chapter);
export const useAutoplay = () => useSyncExternalStore(subscribe, () => dyno.autoplay);
export const useSound = () => useSyncExternalStore(subscribe, () => dyno.sound);
export const useEntered = () => useSyncExternalStore(subscribe, () => dyno.entered);
