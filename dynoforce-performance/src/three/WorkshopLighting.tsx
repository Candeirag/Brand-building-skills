import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Quality } from '../hooks/useQuality';
import { dyno } from '../state/dynoStore';
import { debugState } from './debug';

interface WorkshopLightingProps {
  accent: string;
  quality: Quality;
}

/**
 * Toda a luz da oficina responde a `energy` (0 → 1): no início só o contorno
 * do carro aparece; no pico a oficina inteira está acesa.
 */
export function WorkshopLighting({ accent, quality }: WorkshopLightingProps) {
  const scene = useThree((state) => state.scene);
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const front = useRef<THREE.SpotLight>(null);
  const rearGlow = useRef<THREE.PointLight>(null);
  const dynoGlow = useRef<THREE.PointLight>(null);
  const wallGlowL = useRef<THREE.PointLight>(null);
  const wallGlowR = useRef<THREE.PointLight>(null);
  const reveal = useRef(0);

  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.set(0, 0.5, 0.3);
    return object;
  }, []);

  useEffect(() => {
    scene.add(target);
    return () => {
      scene.remove(target);
    };
  }, [scene, target]);

  useFrame((_, delta) => {
    const s = dyno.sample;
    // O carro "acende" depois que a tela de carregamento sai.
    const revealTarget = dyno.entered ? 1 : 0.12;
    reveal.current += (revealTarget - reveal.current) * (1 - Math.exp(-Math.min(delta, 0.05) * 1.1));
    if (debugState.camera) reveal.current = 1;
    const r = reveal.current;
    const e = s.energy;

    scene.environmentIntensity = r * (0.34 + 1.0 * e);
    if (ambient.current) ambient.current.intensity = r * (0.05 + 0.34 * e);
    if (key.current) key.current.intensity = r * (26 + 520 * e);
    if (rim.current) rim.current.intensity = r * (70 + 300 * e);
    if (front.current) front.current.intensity = r * (8 + 330 * e);
    if (rearGlow.current) rearGlow.current.intensity = r * (5 + 22 * e + 26 * s.peak);
    if (dynoGlow.current) dynoGlow.current.intensity = r * (0.6 + 5 * e + 9 * s.peak);
    if (wallGlowL.current) wallGlowL.current.intensity = r * (5 + 30 * e);
    if (wallGlowR.current) wallGlowR.current.intensity = r * (5 + 30 * e);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0} color="#aab4d0" />

      {/* Principal: de cima, por trás e pela direita */}
      <spotLight
        ref={key}
        position={[3.6, 4.4, 5.2]}
        target={target}
        angle={0.62}
        penumbra={0.9}
        decay={2}
        distance={22}
        color="#f1f4ff"
        intensity={0}
        castShadow={quality.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* Contraluz frio: recorta o teto e os ombros do carro */}
      <spotLight
        ref={rim}
        position={[-4.4, 3.6, -5.4]}
        target={target}
        angle={0.7}
        penumbra={1}
        decay={2}
        distance={24}
        color="#cdd8ff"
        intensity={0}
      />
      {/* Preenchimento frontal, entra no capítulo final */}
      <spotLight
        ref={front}
        position={[-3.2, 3.8, 3.4]}
        target={target}
        angle={0.8}
        penumbra={1}
        decay={2}
        distance={20}
        color="#ffffff"
        intensity={0}
      />

      {/* Luz de destaque: atrás do carro, sob o dinamômetro e na parede */}
      <pointLight ref={rearGlow} position={[0, 1.5, 4.4]} color={accent} decay={2} distance={9} />
      <pointLight ref={dynoGlow} position={[0, 0.16, 1.5]} color={accent} decay={2} distance={4} />
      <pointLight ref={wallGlowL} position={[-5, 1.2, -8]} color={accent} decay={2} distance={11} />
      <pointLight ref={wallGlowR} position={[5, 1.2, -8]} color={accent} decay={2} distance={11} />

      {/* Mapa de ambiente procedural: são estas formas que aparecem na pintura */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#020203']} />
        {[-2.6, -0.9, 0.9, 2.6].map((x) => (
          <Lightformer
            key={x}
            form="rect"
            intensity={3.2}
            color="#f3f6ff"
            position={[x, 4.4, 0.4]}
            rotation-x={Math.PI / 2}
            scale={[0.34, 7, 1]}
          />
        ))}
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#dbe4ff"
          position={[-9, 2, 1]}
          rotation-y={Math.PI / 2}
          scale={[12, 2.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#ffffff"
          position={[9, 2, -1]}
          rotation-y={-Math.PI / 2}
          scale={[12, 1.6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={4}
          color={accent}
          position={[0, 0.9, 9]}
          rotation-y={Math.PI}
          scale={[14, 0.5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3}
          color={accent}
          position={[0, 1, -9]}
          scale={[18, 0.4, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.4}
          color="#ffffff"
          position={[0.5, 1, -6]}
          scale={1.4}
        />
      </Environment>
    </>
  );
}
