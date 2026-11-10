import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { carConfig, dynoConfig } from '../config/carConfig';
import { dyno } from '../state/dynoStore';
import { visualSpin, wheelAngularSpeed } from './useCarAnimation';

/** Recartilhado do rolo: riscos ao longo do eixo, para o giro ser legível. */
function createKnurlTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#6d6d72';
  ctx.fillRect(0, 0, 512, 32);
  for (let x = 0; x < 512; x += 2) {
    const v = 70 + Math.floor(Math.random() * 110);
    ctx.fillStyle = `rgb(${v},${v},${v + 4})`;
    ctx.fillRect(x, 0, 2, 32);
  }
  // Uma faixa pintada por volta, como marca de referência do sensor.
  ctx.fillStyle = '#d8d8dc';
  ctx.fillRect(0, 0, 10, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

interface DynoRollersProps {
  accent: string;
}

export function DynoRollers({ accent }: DynoRollersProps) {
  const rollers = useRef<THREE.Group[]>([]);
  const leds = useRef<THREE.MeshBasicMaterial[]>([]);
  const angle = useRef(0);
  const knurl = useMemo(createKnurlTexture, []);
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);

  useEffect(() => () => knurl.dispose(), [knurl]);

  const { axleZ, rollerRadius, rollerSpacing, rollerLength } = dynoConfig;
  const track = carConfig.drivenTrack;
  const contact = carConfig.wheelRadius + rollerRadius;
  const rollerY = carConfig.wheelRadius - Math.sqrt(contact * contact - rollerSpacing * rollerSpacing);

  const slotHalfZ = rollerSpacing + rollerRadius + 0.05;
  const slotHalfX = rollerLength / 2 + 0.04;
  const deckHalfX = track + slotHalfX + 0.34;
  const deckHalfZ = slotHalfZ + 0.3;
  const deckHeight = 0.024;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const ratio = carConfig.wheelRadius / rollerRadius;
    angle.current += visualSpin(wheelAngularSpeed() * ratio, 44) * dt;
    for (const roller of rollers.current) roller.rotation.x = angle.current;
    const glow = 0.5 + 2.6 * dyno.sample.energy + 1.4 * dyno.sample.peak;
    for (const led of leds.current) led.color.copy(accentColor).multiplyScalar(glow);
  });

  const rollerPositions: [number, number, number][] = [];
  for (const side of [-1, 1]) {
    for (const dz of [-rollerSpacing, rollerSpacing]) {
      rollerPositions.push([side * track, rollerY, axleZ + dz]);
    }
  }

  // Chapas do deque: contornam as duas aberturas dos rolos.
  const innerHalfX = track - slotHalfX;
  const plates: { position: [number, number, number]; size: [number, number, number] }[] = [
    {
      position: [0, deckHeight / 2, axleZ - slotHalfZ - 0.15],
      size: [deckHalfX * 2, deckHeight, 0.3],
    },
    {
      position: [0, deckHeight / 2, axleZ + slotHalfZ + 0.15],
      size: [deckHalfX * 2, deckHeight, 0.3],
    },
    { position: [0, deckHeight / 2, axleZ], size: [innerHalfX * 2, deckHeight, slotHalfZ * 2] },
    {
      position: [-(track + slotHalfX + 0.17), deckHeight / 2, axleZ],
      size: [0.34, deckHeight, slotHalfZ * 2],
    },
    {
      position: [track + slotHalfX + 0.17, deckHeight / 2, axleZ],
      size: [0.34, deckHeight, slotHalfZ * 2],
    },
  ];

  return (
    <group>
      {/* Poço dos rolos */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * track, 0.004, axleZ]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[slotHalfX * 2, slotHalfZ * 2]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      ))}

      {plates.map((plate, i) => (
        <mesh key={i} position={plate.position} receiveShadow>
          <boxGeometry args={plate.size} />
          <meshStandardMaterial color="#1b1b1e" metalness={0.85} roughness={0.42} />
        </mesh>
      ))}

      {rollerPositions.map((position, i) => (
        <group
          key={i}
          position={position}
          ref={(group) => {
            if (group) rollers.current[i] = group;
          }}
        >
          <mesh rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[rollerRadius, rollerRadius, rollerLength, 40, 1]} />
            <meshStandardMaterial map={knurl} color="#77777c" metalness={0.9} roughness={0.46} />
          </mesh>
        </group>
      ))}

      {/* Tampa do eixo que liga os dois conjuntos de rolos */}
      <mesh position={[0, 0.05, axleZ]} castShadow>
        <boxGeometry args={[innerHalfX * 2 - 0.1, 0.06, 0.34]} />
        <meshStandardMaterial color="#121214" metalness={0.8} roughness={0.5} />
      </mesh>

      {/* Freio de correntes parasitas, ao lado do rolo esquerdo */}
      <group position={[-(deckHalfX + 0.5), 0, axleZ]}>
        <mesh position={[0, 0.11, 0]} castShadow>
          <boxGeometry args={[0.62, 0.22, 0.66]} />
          <meshStandardMaterial color="#111113" metalness={0.7} roughness={0.55} />
        </mesh>
        <mesh position={[0.32, 0.11, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 28]} />
          <meshStandardMaterial color="#2c2c30" metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.226, 0.2]}>
          <boxGeometry args={[0.5, 0.012, 0.03]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) leds.current[2] = m;
            }}
            color={accent}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Fitas de LED nas bordas do deque */}
      {[-1, 1].map((dir, i) => (
        <mesh key={dir} position={[0, deckHeight + 0.006, axleZ + dir * (deckHalfZ + 0.01)]}>
          <boxGeometry args={[deckHalfX * 2, 0.012, 0.022]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) leds.current[i] = m;
            }}
            color={accent}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Calços das rodas dianteiras */}
      {[-1, 1].map((side) =>
        [-1, 1].map((dir) => (
          <mesh
            key={`${side}${dir}`}
            position={[side * 0.835, 0.07, -1.155 + dir * 0.4]}
            rotation-x={dir * 0.5}
            castShadow
          >
            <boxGeometry args={[0.3, 0.14, 0.2]} />
            <meshStandardMaterial color="#0c0c0d" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}
