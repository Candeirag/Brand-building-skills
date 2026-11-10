import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { dyno } from '../state/dynoStore';

const vertexShader = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vTwinkle;
  void main() {
    vec3 p = position;
    float k = aSeed * 6.283;
    p.x += sin(uTime * 0.11 + k) * 0.5;
    p.y += sin(uTime * 0.07 + k * 1.7) * 0.3;
    p.z = mod(position.z + 6.0 + uTime * (0.05 + aSeed * 0.08), 13.0) - 6.0;
    vTwinkle = 0.45 + 0.55 * sin(uTime * (0.6 + aSeed) + k * 3.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.4 + aSeed * 2.4) * uPixelRatio * (5.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uIntensity;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vTwinkle * uIntensity;
    gl_FragColor = vec4(vec3(0.9, 0.93, 1.0) * a, a);
  }
`;

/** Poeira em suspensão: pontos minúsculos que só aparecem onde há luz. */
export function DustMotes({ count }: { count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = 0.15 + Math.random() * 3.4;
      positions[i * 3 + 2] = -6 + Math.random() * 13;
      seeds[i] = Math.random();
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return buffer;
  }, [count]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uIntensity: { value: 0 }, uPixelRatio: { value: 1 } }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uTime.value = state.clock.elapsedTime;
    u.uIntensity.value = 0.1 + 0.5 * dyno.sample.energy;
    u.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
