import { useState } from 'react';

function detectWebGL(): boolean {
  if (new URLSearchParams(window.location.search).get('webgl') === 'off') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** `false` quando o navegador não cria um contexto WebGL (ou com `?webgl=off`). */
export function useWebGLSupport(): boolean {
  const [supported] = useState(detectWebGL);
  return supported;
}
