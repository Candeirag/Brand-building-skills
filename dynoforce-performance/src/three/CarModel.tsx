import { useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { carConfig, type MaterialOverride } from '../config/carConfig';
import { useCarAnimation, type CarRig, type WheelRig } from './useCarAnimation';

/** O GLTFLoader renomeia nodes repetidos para `nome_1`, `nome_2`… */
const matchesName = (objectName: string, wanted: string) =>
  objectName === wanted || new RegExp(`^${wanted}_\\d+$`).test(objectName);

/**
 * Limita o brilho de saída do material. Num reflexo rasante de holofote o
 * termo especular passa do máximo do buffer de ponto flutuante (vira Inf), e
 * o bloom transforma um único pixel assim numa tela preta.
 */
function clampHighlights<T extends THREE.Material>(material: T): T {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'gl_FragColor.rgb = min(gl_FragColor.rgb, vec3(24.0));\n#include <tonemapping_fragment>',
    );
  };
  return material;
}

function createMaterials(accent: string) {
  const paint = new THREE.MeshPhysicalMaterial({ ...carConfig.paint, envMapIntensity: 1.35 });
  const rim = new THREE.MeshStandardMaterial({ color: '#17171a', metalness: 1, roughness: 0.3 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#020203',
    metalness: 0.6,
    roughness: 0.16,
    transparent: true,
    opacity: 0.9,
    envMapIntensity: 1.6,
  });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.4, roughness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: '#0b0b0c', metalness: 0.1, roughness: 0.75 });
  const tail = new THREE.MeshStandardMaterial({
    color: '#3a0400',
    emissive: '#ff1a05',
    emissiveIntensity: 1,
    roughness: 0.25,
    toneMapped: false,
  });
  const lens = new THREE.MeshStandardMaterial({ color: '#0c0101', metalness: 0.2, roughness: 0.3 });
  const tire = new THREE.MeshStandardMaterial({ color: '#050506', metalness: 0, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: '#4a4a50', metalness: 1, roughness: 0.34 });
  [paint, rim, glass, accentMat, dark, lens, tire, metal].forEach(clampHighlights);
  return { paint, rim, glass, accent: accentMat, dark, tail, lens, tire, metal } satisfies Record<
    MaterialOverride['kind'],
    THREE.Material
  >;
}

/** Textura do disco de borrão: anéis concêntricos, como um aro girando rápido. */
function createBlurTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(60,60,64,0.95)');
  g.addColorStop(0.2, 'rgba(120,120,126,0.75)');
  g.addColorStop(0.3, 'rgba(46,46,50,0.7)');
  g.addColorStop(0.62, 'rgba(84,84,90,0.62)');
  g.addColorStop(0.86, 'rgba(58,58,62,0.74)');
  g.addColorStop(0.95, 'rgba(170,170,176,0.9)');
  g.addColorStop(1, 'rgba(40,40,44,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const streak = ctx.createRadialGradient(
      c + Math.cos(a) * c * 0.55,
      c + Math.sin(a) * c * 0.55,
      0,
      c + Math.cos(a) * c * 0.55,
      c + Math.sin(a) * c * 0.55,
      c * 0.5,
    );
    streak.addColorStop(0, 'rgba(255,255,255,0.07)');
    streak.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function logNodes(scene: THREE.Object3D) {
  const lines: string[] = [];
  scene.traverse((object) => {
    let depth = 0;
    for (let p = object.parent; p && p !== scene.parent; p = p.parent) depth++;
    const mesh = object as THREE.Mesh;
    const material = mesh.isMesh ? ` · material: ${(mesh.material as THREE.Material).name}` : '';
    lines.push(`${'  '.repeat(depth)}${object.name || '(sem nome)'} [${object.type}]${material}`);
  });
  console.info(`[carConfig] nodes de ${carConfig.url}:\n${lines.join('\n')}`);
}

/**
 * O useGLTF devolve sempre a mesma cena em cache. Preparar duas vezes (modo
 * estrito do React, recarga a quente) duplicaria discos e grupos, então o
 * resultado fica guardado por cena.
 */
const rigs = new WeakMap<THREE.Object3D, CarRig>();

function prepareCar(scene: THREE.Object3D, accent: string): CarRig {
  const cached = rigs.get(scene);
  if (cached) return cached;
  const materials = createMaterials(accent);
  const blurTexture = createBlurTexture();

  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    for (const override of carConfig.materials) {
      if (override.meshes.some((name) => matchesName(mesh.name, name))) {
        mesh.material = materials[override.kind];
        break;
      }
    }
  });

  const wheels: WheelRig[] = [];
  for (const config of carConfig.wheels) {
    const node = scene.getObjectByName(config.node);
    if (!node || !node.parent) {
      console.warn(
        `[carConfig] roda "${config.node}" não encontrada em ${carConfig.url}. ` +
          'Abra com ?debug=nodes para listar os nodes do modelo.',
      );
      continue;
    }

    // Pinças e discos saem do node que gira e ficam num grupo irmão, parado.
    if (config.staticChildren?.length) {
      const fixed = new THREE.Group();
      fixed.name = `${config.node}_static`;
      fixed.position.copy(node.position);
      fixed.quaternion.copy(node.quaternion);
      fixed.scale.copy(node.scale);
      node.parent.add(fixed);
      const parts = node.children.filter((child) =>
        config.staticChildren!.some((name) => matchesName(child.name, name)),
      );
      parts.forEach((part) => fixed.add(part));
    }

    const wheelRig: WheelRig = { config, node, baseQuaternion: node.quaternion.clone() };

    if (config.driven) {
      const side = Math.sign(node.position.x) || 1;
      const blur = new THREE.Mesh(
        new THREE.CircleGeometry(carConfig.wheelRadius * 0.77, 48),
        new THREE.MeshBasicMaterial({
          map: blurTexture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      blur.name = `${config.node}_blur`;
      blur.position.copy(node.position);
      blur.position.x += side * carConfig.wheelFaceOffset;
      blur.rotation.y = (side * Math.PI) / 2;
      blur.renderOrder = 1;
      node.parent.add(blur);
      wheelRig.blur = blur;
    }

    wheels.push(wheelRig);
  }

  const body = scene.getObjectByName(carConfig.bodyNode) ?? null;
  if (!body) console.warn(`[carConfig] carroceria "${carConfig.bodyNode}" não encontrada.`);

  const rig: CarRig = {
    wheels,
    body,
    bodyBasePosition: body ? body.position.clone() : new THREE.Vector3(),
    bodyBaseQuaternion: body ? body.quaternion.clone() : new THREE.Quaternion(),
    tailMaterial: materials.tail,
  };
  rigs.set(scene, rig);
  return rig;
}

interface CarModelProps {
  accent: string;
  onReady?: () => void;
}

export function CarModel({ accent, onReady }: CarModelProps) {
  const { scene } = useGLTF(carConfig.url, carConfig.dracoPath);
  const shadowMap = useTexture(carConfig.shadow.texture);
  const rig = useMemo(() => prepareCar(scene, accent), [scene, accent]);
  useCarAnimation(rig);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('debug') === 'nodes') logNodes(scene);
    onReady?.();
  }, [scene, onReady]);

  const { position, rotationY, scale } = carConfig.transform;

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <primitive object={scene} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.026} renderOrder={2}>
        <planeGeometry args={carConfig.shadow.size} />
        <meshBasicMaterial
          map={shadowMap}
          blending={THREE.MultiplyBlending}
          toneMapped={false}
          transparent
          premultipliedAlpha
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload(carConfig.url, carConfig.dracoPath);
