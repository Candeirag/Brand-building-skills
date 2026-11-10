import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { lerp } from '../lib/dynoPhysics';
import { dyno } from '../state/dynoStore';
import { debugState } from './debug';

/**
 * A câmera orbita o carro em coordenadas cilíndricas (ângulo, raio, altura),
 * então passar de trás para a frente é um travelling em arco, não um corte por
 * dentro do carro. `azimuth` 0° = exatamente atrás; positivo = lado direito.
 *
 * `offsetX`/`offsetY` deslocam o carro na tela (fração da largura/altura) sem
 * mudar a perspectiva: é o que abre espaço para o texto à esquerda.
 */
interface Keyframe {
  p: number;
  azimuth: number;
  radius: number;
  height: number;
  target: [number, number, number];
  fov: number;
  offsetX: number;
  offsetY: number;
}

const DESKTOP: Keyframe[] = [
  { p: 0, azimuth: 27, radius: 8.3, height: 1.35, target: [0, 0.55, 0.3], fov: 30, offsetX: 0.215, offsetY: 0.0 },
  { p: 0.14, azimuth: 33, radius: 7.6, height: 1.14, target: [0, 0.55, 0.4], fov: 30, offsetX: 0.2, offsetY: 0.0 },
  { p: 0.36, azimuth: 46, radius: 5.2, height: 0.6, target: [0.2, 0.44, 0.95], fov: 32, offsetX: 0.15, offsetY: -0.04 },
  { p: 0.5, azimuth: 16, radius: 6.6, height: 0.82, target: [0, 0.56, 0.5], fov: 32, offsetX: 0.03, offsetY: -0.1 },
  { p: 0.7, azimuth: 0, radius: 6.4, height: 0.74, target: [0, 0.6, 0.3], fov: 34, offsetX: -0.02, offsetY: -0.12 },
  { p: 0.82, azimuth: -72, radius: 6.8, height: 1.25, target: [0, 0.5, 0], fov: 32, offsetX: 0.12, offsetY: -0.02 },
  { p: 1, azimuth: -141, radius: 9.2, height: 1.6, target: [0, 0.5, -0.1], fov: 30, offsetX: 0.21, offsetY: -0.02 },
];

/** Tela em pé: carro na metade de cima, texto embaixo. */
const PORTRAIT: Keyframe[] = [
  { p: 0, azimuth: 30, radius: 10.4, height: 1.7, target: [0, 0.55, 0.2], fov: 40, offsetX: 0, offsetY: -0.19 },
  { p: 0.14, azimuth: 34, radius: 9.6, height: 1.5, target: [0, 0.55, 0.3], fov: 40, offsetX: 0, offsetY: -0.19 },
  { p: 0.36, azimuth: 48, radius: 7.2, height: 0.8, target: [0.1, 0.46, 0.8], fov: 40, offsetX: 0, offsetY: -0.17 },
  { p: 0.5, azimuth: 16, radius: 9.0, height: 1.0, target: [0, 0.56, 0.4], fov: 40, offsetX: 0, offsetY: -0.2 },
  { p: 0.7, azimuth: 0, radius: 8.4, height: 0.9, target: [0, 0.6, 0.3], fov: 40, offsetX: 0, offsetY: -0.2 },
  { p: 0.82, azimuth: -72, radius: 10.4, height: 1.5, target: [0, 0.5, 0], fov: 40, offsetX: 0, offsetY: -0.2 },
  { p: 1, azimuth: -138, radius: 10.6, height: 1.8, target: [0, 0.5, -0.1], fov: 40, offsetX: 0, offsetY: -0.2 },
];

const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function sampleKeyframes(frames: Keyframe[], p: number, out: Keyframe) {
  let i = 0;
  while (i < frames.length - 2 && p > frames[i + 1].p) i++;
  const a = frames[i];
  const b = frames[i + 1];
  const t = ease(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));
  out.azimuth = lerp(a.azimuth, b.azimuth, t);
  out.radius = lerp(a.radius, b.radius, t);
  out.height = lerp(a.height, b.height, t);
  out.fov = lerp(a.fov, b.fov, t);
  out.offsetX = lerp(a.offsetX, b.offsetX, t);
  out.offsetY = lerp(a.offsetY, b.offsetY, t);
  for (let k = 0; k < 3; k++) out.target[k] = lerp(a.target[k], b.target[k], t);
}

const lookTarget = new THREE.Vector3();

export function CameraController() {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const size = useThree((state) => state.size);
  const desired = useRef<Keyframe>({ ...DESKTOP[0], target: [...DESKTOP[0].target] });
  const current = useRef<Keyframe | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => () => camera.clearViewOffset(), [camera]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const portrait = size.width / size.height < 0.9;
    const d = desired.current;

    const override = debugState.camera;
    if (override) {
      d.azimuth = override.azimuth;
      d.radius = override.radius;
      d.height = override.height;
      d.fov = override.fov;
      d.offsetX = override.offsetX ?? 0;
      d.offsetY = override.offsetY ?? 0;
      d.target = [...override.target];
    } else {
      sampleKeyframes(portrait ? PORTRAIT : DESKTOP, dyno.sample.p, d);
      // Entre o retrato e o paisagem (tablets), afasta um pouco a câmera.
      if (!portrait) d.radius *= 1 + Math.max(0, 1.5 - size.width / size.height) * 0.55;
    }

    if (!current.current || override || reduced.current) {
      current.current = { ...d, target: [...d.target] };
    } else {
      const c = current.current;
      const k = 1 - Math.exp(-dt * 4.5);
      c.azimuth = lerp(c.azimuth, d.azimuth, k);
      c.radius = lerp(c.radius, d.radius, k);
      c.height = lerp(c.height, d.height, k);
      c.fov = lerp(c.fov, d.fov, k);
      c.offsetX = lerp(c.offsetX, d.offsetX, k);
      c.offsetY = lerp(c.offsetY, d.offsetY, k);
      for (let i = 0; i < 3; i++) c.target[i] = lerp(c.target[i], d.target[i], k);
    }
    const c = current.current;

    // Paralaxe do ponteiro e tremor no pico.
    const still = override !== null || reduced.current;
    const pk = 1 - Math.exp(-dt * 2.5);
    pointer.current.x = lerp(pointer.current.x, still ? 0 : dyno.pointerX, pk);
    pointer.current.y = lerp(pointer.current.y, still ? 0 : dyno.pointerY, pk);
    const t = state.clock.elapsedTime;
    const shake = still ? 0 : dyno.sample.peak * 0.011 + dyno.sample.load * 0.002;

    const azimuth = THREE.MathUtils.degToRad(c.azimuth + pointer.current.x * 2.6);
    camera.position.set(
      Math.sin(azimuth) * c.radius + Math.sin(t * 31) * shake,
      c.height - pointer.current.y * 0.12 + Math.sin(t * 37 + 1.7) * shake,
      Math.cos(azimuth) * c.radius,
    );
    lookTarget.set(c.target[0], c.target[1], c.target[2]);
    camera.lookAt(lookTarget);

    camera.fov = c.fov - dyno.sample.peak * (still ? 0 : 1.2);
    camera.setViewOffset(
      size.width,
      size.height,
      -c.offsetX * size.width,
      -c.offsetY * size.height,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();
    debugState.frames++;
    debugState.scene = state.scene;
  });

  return null;
}
