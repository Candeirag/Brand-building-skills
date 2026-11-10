/**
 * Gancho de depuração (`?debug=1`): permite fixar a câmera e o progresso pelo
 * console — é assim que as imagens estáticas de `public/images/` foram geradas.
 *
 *   __dyno.setProgress(0.6)
 *   __dyno.camera({ azimuth: -140, radius: 5, height: 0.9, target: [0, 0.5, 0], fov: 30 })
 *   __dyno.camera(null)   // devolve o controle ao scroll
 */
export interface DebugCamera {
  azimuth: number;
  radius: number;
  height: number;
  target: [number, number, number];
  fov: number;
  offsetX?: number;
  offsetY?: number;
}

export const debugState: { camera: DebugCamera | null; frames: number; scene: unknown } = {
  camera: null,
  frames: 0,
  scene: null,
};

export const debugEnabled =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
