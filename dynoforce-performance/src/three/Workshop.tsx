import { MeshReflectorMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { brand } from '../config/siteConfig';
import type { Quality } from '../hooks/useQuality';
import { dyno } from '../state/dynoStore';

const WALL_Z = -9;
const CEILING_Y = 4.6;

/** Letreiro luminoso da parede do fundo, desenhado com a fonte do site. */
function useSignTexture(): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;
    const draw = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 384;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 230px "Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif';
      ctx.fillText(brand.wordmark.primary, canvas.width / 2, 150, canvas.width - 80);
      ctx.font = '500 64px "Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif';
      const sub = brand.wordmark.secondary.split('').join('  ');
      ctx.fillText(sub, canvas.width / 2, 322, canvas.width - 80);
      created = new THREE.CanvasTexture(canvas);
      created.colorSpace = THREE.SRGBColorSpace;
      created.anisotropy = 8;
      setTexture(created);
    };
    document.fonts.ready.then(draw, draw);
    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, []);

  return texture;
}

interface FanProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  blades?: number;
  /** Com pedestal (ventilador de piso) ou embutido na parede. */
  stand?: boolean;
}

/** Ventilador industrial: aro, grade e pás que aceleram com a oficina. */
function Fan({ position, rotation = [0, 0, 0], radius = 0.62, blades = 5, stand = false }: FanProps) {
  const rotor = useRef<THREE.Group>(null);
  const speed = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = dyno.sample;
    const target = s.energy < 0.12 ? 0.25 : 3 + 23 * s.energy;
    speed.current += (target - speed.current) * (1 - Math.exp(-dt * 1.4));
    if (rotor.current) rotor.current.rotation.z -= speed.current * dt;
  });

  const bladeAngles = useMemo(
    () => Array.from({ length: blades }, (_, i) => (i / blades) * Math.PI * 2),
    [blades],
  );

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <torusGeometry args={[radius, radius * 0.07, 10, 48]} />
        <meshStandardMaterial color="#1c1c1f" metalness={0.9} roughness={0.4} />
      </mesh>
      <mesh position-z={-radius * 0.22}>
        <cylinderGeometry args={[radius * 1.02, radius * 1.02, radius * 0.44, 40, 1, true]} />
        <meshStandardMaterial
          color="#101012"
          metalness={0.85}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Grade de proteção */}
      {[0.34, 0.66].map((k) => (
        <mesh key={k} position-z={radius * 0.03}>
          <torusGeometry args={[radius * k, 0.008, 6, 40]} />
          <meshStandardMaterial color="#3a3a3e" metalness={1} roughness={0.35} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position-z={radius * 0.03} rotation-z={(i / 8) * Math.PI}>
          <boxGeometry args={[radius * 2, 0.008, 0.008]} />
          <meshStandardMaterial color="#3a3a3e" metalness={1} roughness={0.35} />
        </mesh>
      ))}
      <group ref={rotor} position-z={-radius * 0.14}>
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[radius * 0.17, radius * 0.17, radius * 0.2, 20]} />
          <meshStandardMaterial color="#232326" metalness={0.9} roughness={0.35} />
        </mesh>
        {bladeAngles.map((a) => (
          <group key={a} rotation-z={a}>
            <mesh position-x={radius * 0.55} rotation-x={0.55}>
              <boxGeometry args={[radius * 0.78, radius * 0.34, 0.012]} />
              <meshStandardMaterial color="#2b2b2f" metalness={0.9} roughness={0.38} />
            </mesh>
          </group>
        ))}
      </group>
      {stand && (
        <>
          <mesh position={[0, -radius - 0.16, -radius * 0.2]}>
            <boxGeometry args={[0.07, 0.36, 0.07]} />
            <meshStandardMaterial color="#141416" metalness={0.8} roughness={0.5} />
          </mesh>
          <mesh position={[0, -radius - 0.33, -radius * 0.2]}>
            <boxGeometry args={[radius * 1.5, 0.05, radius * 1.1]} />
            <meshStandardMaterial color="#141416" metalness={0.8} roughness={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
}

const beamVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const beamFragment = /* glsl */ `
  uniform float uIntensity;
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;
  void main() {
    // max/clamp: com MSAA a interpolação pode sair um pouco do intervalo, e
    // pow() de número negativo vira NaN, que o bloom espalharia pela tela.
    float facing = pow(clamp(abs(dot(normalize(vNormal), normalize(vView))), 0.0, 1.0), 2.2);
    float along = pow(clamp(vUv.y, 0.0, 1.0), 1.7);
    float streak = 0.82 + 0.18 * sin(vUv.x * 46.0 + uTime * 0.35) * sin(vUv.x * 17.0 - uTime * 0.2);
    float alpha = facing * along * streak * uIntensity;
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`;

/** Facho de luz no ar empoeirado: um cone aditivo, mais forte perto da luminária. */
function LightBeam({ position, color }: { position: [number, number, number]; color: string }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uIntensity: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    }),
    [color],
  );

  useFrame((state) => {
    if (!material.current) return;
    const s = dyno.sample;
    material.current.uniforms.uIntensity.value = 0.012 + 0.085 * s.energy + 0.03 * s.smoke;
    material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const height = CEILING_Y - 0.15;
  return (
    <mesh position={[position[0], height / 2, position[2]]}>
      <coneGeometry args={[1.9, height, 40, 1, true]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={beamVertex}
        fragmentShader={beamFragment}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.CustomBlending}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneFactor}
      />
    </mesh>
  );
}

interface WorkshopProps {
  accent: string;
  quality: Quality;
}

export function Workshop({ accent, quality }: WorkshopProps) {
  const sign = useSignTexture();
  const signMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const tubes = useRef<THREE.MeshBasicMaterial[]>([]);
  const wallLed = useRef<THREE.MeshBasicMaterial>(null);
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame(() => {
    const s = dyno.sample;
    const white = 0.05 + 2.4 * s.energy;
    for (const tube of tubes.current) tube.color.setScalar(white);
    wallLed.current?.color.copy(accentColor).multiplyScalar(0.45 + 2.2 * s.energy + s.peak);
    signMaterial.current?.color.setScalar(0.16 + 0.95 * s.energy);
  });

  const tubeXs = [-2.6, -0.9, 0.9, 2.6];
  const columns = [-8, -4.8, -1.6, 1.6, 4.8, 8];

  return (
    <group>
      {/* Piso de epóxi */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[44, 44]} />
        {quality.reflections ? (
          <MeshReflectorMaterial
            resolution={768}
            blur={[320, 90]}
            mixBlur={1}
            mixStrength={26}
            mixContrast={1}
            mirror={0.55}
            roughness={0.78}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#0b0b0c"
            metalness={0.55}
          />
        ) : (
          <meshStandardMaterial color="#0b0b0c" roughness={0.62} metalness={0.5} />
        )}
      </mesh>

      {/* Paredes e teto */}
      <mesh position={[0, CEILING_Y / 2, WALL_Z]}>
        <planeGeometry args={[30, CEILING_Y]} />
        <meshStandardMaterial color="#0a0a0b" roughness={0.88} metalness={0.1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 11, CEILING_Y / 2, 0]}
          rotation-y={(-side * Math.PI) / 2}
        >
          <planeGeometry args={[24, CEILING_Y]} />
          <meshStandardMaterial color="#080809" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      <mesh position={[0, CEILING_Y, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[30, 24]} />
        <meshStandardMaterial color="#060607" roughness={1} />
      </mesh>

      {/* Colunas e rodapé técnico da parede do fundo */}
      {columns.map((x) => (
        <mesh key={x} position={[x, CEILING_Y / 2, WALL_Z + 0.12]}>
          <boxGeometry args={[0.32, CEILING_Y, 0.24]} />
          <meshStandardMaterial color="#0d0d0f" roughness={0.7} metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, WALL_Z + 0.3]}>
        <boxGeometry args={[19.5, 1, 0.6]} />
        <meshStandardMaterial color="#0c0c0e" roughness={0.55} metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.03, WALL_Z + 0.58]}>
        <boxGeometry args={[19.5, 0.035, 0.03]} />
        <meshBasicMaterial ref={wallLed} color={accent} toneMapped={false} />
      </mesh>

      {/* Letreiro */}
      {sign && (
        <mesh position={[0, 2.75, WALL_Z + 0.26]}>
          <planeGeometry args={[7.4, 1.39]} />
          <meshBasicMaterial
            ref={signMaterial}
            map={sign}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      )}

      {/* Luminárias tubulares do teto */}
      {tubeXs.map((x, i) => (
        <group key={x} position={[x, CEILING_Y - 0.14, 0.4]}>
          <mesh>
            <boxGeometry args={[0.16, 0.05, 6.4]} />
            <meshBasicMaterial
              ref={(m) => {
                if (m) tubes.current[i] = m;
              }}
              color="#ffffff"
              toneMapped={false}
            />
          </mesh>
          <mesh position-y={0.05}>
            <boxGeometry args={[0.3, 0.05, 6.6]} />
            <meshStandardMaterial color="#151517" metalness={0.8} roughness={0.5} />
          </mesh>
        </group>
      ))}

      <LightBeam position={[-0.9, 0, 1.3]} color="#dfe6ff" />
      <LightBeam position={[0.9, 0, 1.3]} color="#dfe6ff" />
      {quality.tier === 'high' && <LightBeam position={[2.6, 0, -1.2]} color="#dfe6ff" />}

      {/* Ventilador de arrefecimento na frente do carro e exaustores na parede */}
      <Fan position={[0.55, 1.02, -4.15]} rotation={[0, 0.1, 0]} radius={0.66} stand />
      <Fan position={[-5.6, 3.2, WALL_Z + 0.3]} radius={0.5} blades={6} />
      <Fan position={[5.6, 3.2, WALL_Z + 0.3]} radius={0.5} blades={6} />

      {/* Bancada e gabinetes de ferramentas, só como volume no fundo */}
      <mesh position={[-6.4, 0.55, -6.6]} castShadow>
        <boxGeometry args={[2.6, 1.1, 0.8]} />
        <meshStandardMaterial color="#0e0e10" roughness={0.5} metalness={0.75} />
      </mesh>
      <mesh position={[6.2, 0.95, -6.9]} castShadow>
        <boxGeometry args={[1.5, 1.9, 0.7]} />
        <meshStandardMaterial color="#0e0e10" roughness={0.5} metalness={0.75} />
      </mesh>
    </group>
  );
}
