import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { carConfig, dynoConfig } from '../config/carConfig';
import { dyno } from '../state/dynoStore';

const vertexShader = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec4 aParams; // tamanho, rotação, opacidade, semente
  attribute float aAge;   // idade normalizada, 0 → 1
  varying vec2 vUv;
  varying float vAlpha;
  varying float vSeed;
  varying float vAge;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    vAlpha = aParams.z;
    vSeed = aParams.w;
    vAge = aAge;
    float c = cos(aParams.y);
    float s = sin(aParams.y);
    vec2 corner = mat2(c, -s, s, c) * position.xy * aParams.x;
    vec4 mv = viewMatrix * vec4(aOffset, 1.0);
    mv.xy += corner;
    // O billboard fica quase de pé, então a altura no mundo é offset + canto.
    vWorld = vec3(aOffset.x + corner.x, aOffset.y + corner.y, aOffset.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uLight;
  uniform float uAccentAmount;
  uniform vec3 uAccent;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vSeed;
  varying float vAge;
  varying vec3 vWorld;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    vec2 drift = vec2(uTime * 0.035, -uTime * 0.06);
    float n = fbm(vUv * 2.4 + vSeed * 19.0 + drift);
    float n2 = fbm(vUv * 5.2 - vSeed * 7.0 - drift * 1.6);

    // Contorno irregular: o ruído empurra a borda para dentro e para fora.
    float body = smoothstep(1.0, 0.1, r + (n - 0.5) * 1.05);
    // Dissolve: conforme envelhece, só as regiões mais densas sobrevivem.
    float cut = 0.14 + vAge * 0.4;
    float wisps = smoothstep(cut, cut + 0.42, n * 0.62 + n2 * 0.38 + body * 0.22);
    float density = body * wisps;

    // Some ao tocar o piso, sem linha de corte.
    float floorFade = smoothstep(0.0, 0.22, vWorld.y);
    float alpha = density * vAlpha * floorFade;
    if (alpha < 0.003) discard;

    // Volume: o topo de cada tufo pega mais luz que a base.
    float shade = 0.38 + 0.62 * smoothstep(0.1, 0.95, n + p.y * 0.55);
    vec3 base = vec3(0.62, 0.64, 0.68) * (0.1 + 0.9 * uLight) * shade;
    // Perto do chão e atrás do carro, a fumaça pega a luz de destaque.
    float low = smoothstep(1.3, 0.05, vWorld.y);
    vec3 color = base + uAccent * uAccentAmount * low * (0.45 + 0.55 * n2);

    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

interface Particle {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  size: number;
  growth: number;
  rotation: number;
  spin: number;
  seed: number;
  opacity: number;
}

interface SmokeParticlesProps {
  count: number;
  accent: string;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Fumaça de pneu: partículas simuladas na CPU (posição, arrasto, turbulência,
 * empuxo) e desenhadas como billboards com ruído procedural no shader. A
 * emissão acompanha `sample.smoke`; o que já foi emitido se dissipa sozinho,
 * então a fumaça continua no ar depois que o carro alivia.
 */
export function SmokeParticles({ count, accent }: SmokeParticlesProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const emitCarry = useRef(0);
  const idleCarry = useRef(0);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, () => ({
        alive: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        life: 1,
        size: 1,
        growth: 0,
        rotation: 0,
        spin: 0,
        seed: Math.random(),
        opacity: 0,
      })),
    [count],
  );

  const { geometry, offsets, params, ages } = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1);
    const instanced = new THREE.InstancedBufferGeometry();
    instanced.index = plane.index;
    instanced.setAttribute('position', plane.getAttribute('position'));
    instanced.setAttribute('uv', plane.getAttribute('uv'));
    const offsetAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    const paramAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
    const ageAttr = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    offsetAttr.setUsage(THREE.DynamicDrawUsage);
    paramAttr.setUsage(THREE.DynamicDrawUsage);
    ageAttr.setUsage(THREE.DynamicDrawUsage);
    instanced.setAttribute('aOffset', offsetAttr);
    instanced.setAttribute('aParams', paramAttr);
    instanced.setAttribute('aAge', ageAttr);
    instanced.instanceCount = 0;
    return { geometry: instanced, offsets: offsetAttr, params: paramAttr, ages: ageAttr };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLight: { value: 0 },
      uAccentAmount: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
    }),
    [accent],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  const spawn = (kind: 'tire' | 'exhaust', intensity: number) => {
    const particle = particles.find((p) => !p.alive);
    if (!particle) return;
    particle.alive = true;
    particle.age = 0;
    particle.seed = Math.random();
    particle.rotation = rand(0, Math.PI * 2);
    particle.spin = rand(-0.35, 0.35);

    if (kind === 'tire') {
      const side = Math.random() < 0.5 ? -1 : 1;
      particle.x = side * carConfig.drivenTrack + rand(-0.16, 0.16);
      particle.y = rand(0.05, 0.22);
      particle.z = dynoConfig.axleZ + rand(0.3, 0.52);
      // Sai para trás e para fora: o meio fica livre e o carro continua visível.
      particle.vx = side * rand(0.25, 1.05);
      particle.vy = rand(0.12, 0.6);
      particle.vz = rand(1.3, 2.9) * (0.55 + 0.45 * intensity);
      particle.life = rand(3, 5.2);
      particle.size = rand(0.4, 0.7);
      particle.growth = rand(0.42, 0.74);
      particle.opacity = rand(0.2, 0.34) * (0.5 + 0.5 * intensity);
    } else {
      particle.x = carConfig.exhaust[0] + rand(-0.22, 0.22);
      particle.y = carConfig.exhaust[1] + rand(-0.02, 0.04);
      particle.z = carConfig.exhaust[2] + rand(0, 0.08);
      particle.vx = rand(-0.08, 0.08);
      particle.vy = rand(0.05, 0.18);
      particle.vz = rand(0.35, 0.7);
      particle.life = rand(1.6, 2.6);
      particle.size = rand(0.16, 0.26);
      particle.growth = rand(0.22, 0.34);
      particle.opacity = rand(0.07, 0.12);
    }
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const sample = dyno.sample;
    const budget = count / 200;

    emitCarry.current += sample.smoke * 44 * budget * dt;
    while (emitCarry.current >= 1) {
      emitCarry.current -= 1;
      spawn('tire', sample.smoke);
    }
    // Em marcha lenta, só um fio de vapor no escapamento.
    idleCarry.current += (2.2 + 5 * sample.load) * Math.min(budget * 1.5, 1) * dt;
    while (idleCarry.current >= 1) {
      idleCarry.current -= 1;
      if (dyno.entered) spawn('exhaust', 0);
    }

    const drag = Math.exp(-dt * 0.85);
    const wind = 0.25 + 0.9 * sample.energy;
    let visible = 0;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      if (!p.alive) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.alive = false;
        continue;
      }
      const k = p.seed * 6.283;
      p.vx += Math.sin(p.z * 1.7 + t * 0.9 + k) * 0.42 * dt;
      p.vy += (0.1 + Math.cos(p.x * 2.1 + t * 0.7 + k) * 0.22) * dt;
      p.vz += (wind * 0.5 + Math.sin(p.x * 1.3 - t * 0.6 + k) * 0.25) * dt;
      p.vx *= drag;
      p.vy *= drag;
      p.vz *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.rotation += p.spin * dt;

      const age01 = p.age / p.life;
      const size = p.size + p.growth * p.age;
      if (p.y < size * 0.22) p.y = size * 0.22;
      const fadeIn = Math.min(1, p.age / 0.45);
      const fadeOut = Math.pow(1 - age01, 1.5);

      offsets.setXYZ(visible, p.x, p.y, p.z);
      params.setXYZW(visible, size, p.rotation, p.opacity * fadeIn * fadeOut, p.seed);
      ages.setX(visible, age01);
      visible++;
    }

    geometry.instanceCount = visible;
    offsets.needsUpdate = true;
    params.needsUpdate = true;
    ages.needsUpdate = true;

    const u = material.current?.uniforms;
    if (u) {
      u.uTime.value = t;
      u.uLight.value = 0.25 + 0.75 * sample.energy;
      u.uAccentAmount.value = 0.1 + 0.3 * sample.energy + 0.3 * sample.peak;
    }
  });

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={5}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneMinusSrcAlphaFactor}
      />
    </mesh>
  );
}
