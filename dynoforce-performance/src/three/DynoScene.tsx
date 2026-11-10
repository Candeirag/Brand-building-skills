import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { brand } from '../config/siteConfig';
import type { Quality } from '../hooks/useQuality';
import { setProgress } from '../state/dynoStore';
import { CameraController } from './CameraController';
import { CarModel } from './CarModel';
import { debugEnabled, debugState, type DebugCamera } from './debug';
import { DustMotes } from './DustMotes';
import { DynoRollers } from './DynoRollers';
import { Effects, NanProbe } from './Effects';
import { SmokeParticles } from './SmokeParticles';
import { Workshop } from './Workshop';
import { WorkshopLighting } from './WorkshopLighting';

interface BoundaryProps {
  onError: () => void;
  children: ReactNode;
}

/** Qualquer erro da cena (modelo que não carrega, shader, contexto) cai no fallback. */
class SceneBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[DynoScene] a cena 3D falhou; exibindo o fallback.', error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const nanProbe = new URLSearchParams(window.location.search).get('debug') === 'nan';

interface DynoSceneProps {
  quality: Quality;
  /** `false` quando o hero saiu da tela: a cena para de renderizar. */
  active: boolean;
  onReady: () => void;
  onError: () => void;
}

export default function DynoScene({ quality, active, onReady, onError }: DynoSceneProps) {
  const accent = brand.colors.accent;
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, quality.maxDpr));

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, quality.maxDpr));
  }, [quality.maxDpr]);

  useEffect(() => {
    if (!debugEnabled) return;
    const api = {
      setProgress,
      camera: (camera: DebugCamera | null) => {
        debugState.camera = camera;
      },
      frames: () => debugState.frames,
      scene: () => debugState.scene,
    };
    (window as unknown as { __dyno: typeof api }).__dyno = api;
  }, []);

  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.domElement.addEventListener('webglcontextlost', onError, { once: true });
    },
    [onError],
  );

  return (
    <SceneBoundary onError={onError}>
      <Canvas
        dpr={dpr}
        shadows={quality.shadows ? 'percentage' : false}
        frameloop={active ? 'always' : 'never'}
        gl={{
          antialias: !quality.postprocessing,
          alpha: false,
          stencil: false,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 30, near: 0.1, far: 70, position: [3.45, 1.3, 6.77] }}
        onCreated={handleCreated}
      >
        <color attach="background" args={['#030304']} />
        <fogExp2 attach="fog" args={['#030304', 0.04]} />

        {/* DPR adaptativo: se o quadro cair, a resolução cai antes da fluidez. */}
        {!debugEnabled && (
          <PerformanceMonitor
            onDecline={() => setDpr((value) => Math.max(0.75, value - 0.25))}
            onIncline={() =>
              setDpr((value) => Math.min(window.devicePixelRatio, quality.maxDpr, value + 0.25))
            }
          />
        )}

        <WorkshopLighting accent={accent} quality={quality} />
        <Workshop accent={accent} quality={quality} />
        <DynoRollers accent={accent} />
        <Suspense fallback={null}>
          <CarModel accent={accent} onReady={onReady} />
        </Suspense>
        <SmokeParticles count={quality.smokeCount} accent={accent} />
        <DustMotes count={quality.dustCount} />
        <CameraController />
        {quality.postprocessing && (nanProbe ? <NanProbe /> : <Effects />)}
      </Canvas>
    </SceneBoundary>
  );
}
