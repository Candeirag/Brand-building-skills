import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { carConfig, type Axis, type WheelConfig } from '../config/carConfig';
import { heroRun } from '../config/siteConfig';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { smoothstep } from '../lib/dynoPhysics';
import { dyno } from '../state/dynoStore';

export interface WheelRig {
  config: WheelConfig;
  node: THREE.Object3D;
  baseQuaternion: THREE.Quaternion;
  /** Disco de "borrão de movimento" que aparece em alta rotação. */
  blur?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
}

export interface CarRig {
  wheels: WheelRig[];
  body: THREE.Object3D | null;
  bodyBasePosition: THREE.Vector3;
  bodyBaseQuaternion: THREE.Quaternion;
  tailMaterial: THREE.MeshStandardMaterial | null;
}

const AXES: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

/**
 * Teto da velocidade angular DESENHADA (rad/s). A 212 km/h a roda real gira a
 * ~160 rad/s — acima de meia volta de raio por quadro, o que na tela vira
 * cintilação (efeito estroboscópico). A velocidade real segue a telemetria; o
 * que se desenha satura suavemente neste teto e o disco de borrão assume.
 */
const VISUAL_SPIN_CAP = 30;

/** Mesma saturação, usada também pelos rolos. */
export function visualSpin(realRadPerSec: number, cap = VISUAL_SPIN_CAP): number {
  return cap * Math.tanh(realRadPerSec / cap);
}

/** Velocidade angular real das rodas motrizes (rad/s) a partir da telemetria. */
export function wheelAngularSpeed(): number {
  return dyno.sample.speed / 3.6 / carConfig.wheelRadius;
}

const spinQuat = new THREE.Quaternion();
const pitchQuat = new THREE.Quaternion();

export function useCarAnimation(rig: CarRig) {
  const angle = useRef(0);
  const reduced = useRef(prefersReducedMotion());

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const sample = dyno.sample;
    const t = state.clock.elapsedTime;
    const rpmNorm = (sample.rpm - heroRun.idleRpm) / (heroRun.redline - heroRun.idleRpm);

    angle.current += visualSpin(wheelAngularSpeed()) * dt;

    for (const wheel of rig.wheels) {
      if (!wheel.config.driven) continue;
      spinQuat.setFromAxisAngle(AXES[wheel.config.axis], angle.current * wheel.config.direction);
      wheel.node.quaternion.copy(wheel.baseQuaternion).multiply(spinQuat);
      if (wheel.blur) {
        wheel.blur.material.opacity = smoothstep(60, 190, sample.speed) * 0.6;
        wheel.blur.material.color.setScalar(0.18 + 0.5 * sample.energy);
        wheel.blur.rotation.z = angle.current * 0.37;
      }
    }

    if (rig.body) {
      const shake = reduced.current ? 0 : 0.00045 + 0.0016 * rpmNorm * (0.35 + 0.65 * sample.load);
      const buzz = Math.sin(t * 97) * 0.6 + Math.sin(t * 151 + 1.3) * 0.4;
      rig.body.position.copy(rig.bodyBasePosition);
      rig.body.position.y += buzz * shake - sample.load * 0.006;
      rig.body.position.x += Math.sin(t * 83 + 0.7) * shake * 0.5;
      pitchQuat.setFromAxisAngle(AXES.x, sample.load * 0.0075 + buzz * shake * 0.25);
      rig.body.quaternion.copy(pitchQuat).multiply(rig.bodyBaseQuaternion);
    }

    if (rig.tailMaterial) {
      rig.tailMaterial.emissiveIntensity = 0.9 + 2.4 * sample.energy + sample.peak * 1.2;
    }
  });
}
