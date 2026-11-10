import { useFrame, useThree } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, Effect, ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { carConfig } from '../config/carConfig';
import { dyno } from '../state/dynoStore';

const heatHazeShader = /* glsl */ `
  uniform vec2 uCenter;
  uniform float uStrength;
  uniform float uRadius;

  void mainUv(inout vec2 uv) {
    vec2 d = uv - uCenter;
    d.x *= aspect;
    d.y = (d.y - uRadius * 0.45) * 0.6; // a coluna de ar quente sobe
    float mask = smoothstep(uRadius, 0.0, length(d));
    float w1 = sin(uv.y * 150.0 - time * 12.0 + sin(uv.x * 70.0 + time * 3.1) * 2.0);
    float w2 = sin(uv.x * 120.0 + time * 7.3 + uv.y * 45.0);
    uv += vec2(w1, w2 * 0.6) * mask * uStrength;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    outputColor = inputColor;
  }
`;

/** Distorção de calor em volta do escapamento: desloca as UVs da imagem final. */
class HeatHazeEffect extends Effect {
  constructor() {
    super('HeatHazeEffect', heatHazeShader, {
      uniforms: new Map<string, THREE.Uniform>([
        ['uCenter', new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
        ['uStrength', new THREE.Uniform(0)],
        ['uRadius', new THREE.Uniform(0.1)],
      ]),
    });
  }
}

/** Diagnóstico (`?debug=nan`): pinta de magenta os pixels NaN/Inf do render. */
class NanProbeEffect extends Effect {
  constructor() {
    super(
      'NanProbeEffect',
      /* glsl */ `
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        bool bad = any(isnan(inputColor.rgb)) || any(isinf(inputColor.rgb)) || any(greaterThan(inputColor.rgb, vec3(4096.0)));
        outputColor = bad ? vec4(1.0, 0.0, 1.0, 1.0) : vec4(min(inputColor.rgb, vec3(1.0)) * 0.25, 1.0);
      }`,
    );
  }
}

export function NanProbe() {
  const probe = useMemo(() => new NanProbeEffect(), []);
  return (
    <EffectComposer multisampling={4}>
      <primitive object={probe} dispose={null} />
    </EffectComposer>
  );
}

const exhaust = new THREE.Vector3();

export function Effects() {
  const camera = useThree((state) => state.camera);
  const haze = useMemo(() => new HeatHazeEffect(), []);
  const aberration = useRef<{ offset: THREE.Vector2 } | null>(null);
  const aberrationOffset = useMemo(() => new THREE.Vector2(0, 0), []);

  useEffect(() => () => haze.dispose(), [haze]);

  useFrame(() => {
    const sample = dyno.sample;
    exhaust.set(...carConfig.exhaust);
    const distance = camera.position.distanceTo(exhaust);
    // Só existe distorção quando a câmera vê a traseira.
    const behind = THREE.MathUtils.smoothstep(camera.position.z - exhaust.z, 0.3, 2);
    exhaust.project(camera);
    const center = haze.uniforms.get('uCenter')!.value as THREE.Vector2;
    center.set(exhaust.x * 0.5 + 0.5, exhaust.y * 0.5 + 0.5);
    haze.uniforms.get('uRadius')!.value = 0.62 / distance;
    haze.uniforms.get('uStrength')!.value =
      behind * (0.0005 + 0.0019 * sample.load + 0.001 * sample.peak);

    const split = 0.0002 + sample.peak * 0.0011;
    aberration.current?.offset.set(split, split * 0.6);
  });

  return (
    <EffectComposer multisampling={4}>
      <primitive object={haze} dispose={null} />
      <Bloom mipmapBlur intensity={0.42} luminanceThreshold={1} luminanceSmoothing={0.25} />
      <ChromaticAberration
        ref={aberration as never}
        offset={aberrationOffset}
        radialModulation
        modulationOffset={0.35}
      />
      <Vignette offset={0.28} darkness={0.7} />
      <Noise opacity={0.045} blendFunction={BlendFunction.SOFT_LIGHT} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
