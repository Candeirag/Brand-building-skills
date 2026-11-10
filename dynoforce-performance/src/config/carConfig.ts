/**
 * Configuração do modelo 3D do carro.
 *
 * Para trocar o carro:
 *  1. Coloque o novo .glb em `public/models/` e aponte `url` para ele.
 *  2. Abra o site com `?debug=nodes` — o console lista todos os nodes e
 *     materiais do arquivo. Use esses nomes abaixo.
 *  3. Ajuste `wheels`: um item por roda, com o nome do node que contém a roda
 *     inteira (aro + pneu). O giro acontece no eixo LOCAL desse node, então o
 *     pivô do node precisa estar no centro da roda. Se o modelo vier com as
 *     quatro rodas num único mesh, separe-as antes (Blender: "Separate by
 *     loose parts" + "Origin to geometry") — o código não gira o carro inteiro
 *     para fingir movimento.
 *  4. Ajuste `transform` até o carro ficar com a frente para -Z, as rodas
 *     apoiadas em y = 0 e o eixo traseiro em `dyno.axleZ`.
 */

export type Axis = 'x' | 'y' | 'z';

export interface WheelConfig {
  /** Nome do node da roda no GLB. */
  node: string;
  /** Rodas motrizes giram nos rolos; as outras ficam presas. */
  driven: boolean;
  /** Eixo local em torno do qual a roda gira. */
  axis: Axis;
  /** 1 ou -1: sentido que faz o carro andar para a frente. */
  direction: 1 | -1;
  /** Filhos que NÃO giram com a roda (pinça e disco de freio, por exemplo). */
  staticChildren?: string[];
}

export interface MaterialOverride {
  /** Nomes dos meshes (não dos materiais) que recebem o material. */
  meshes: string[];
  kind: 'paint' | 'rim' | 'glass' | 'accent' | 'dark' | 'tail' | 'lens' | 'tire' | 'metal';
}

export const carConfig = {
  url: 'models/ferrari-458.glb',
  /** Pasta com o decodificador Draco (o GLB atual usa compressão Draco). */
  dracoPath: 'draco/',

  transform: {
    position: [0, 0, 0] as [number, number, number],
    rotationY: 0,
    scale: 1,
  },

  /** Node da carroceria: recebe a vibração do motor e o agachamento da traseira. */
  bodyNode: 'main',

  wheels: [
    { node: 'wheel_fl', driven: false, axis: 'x', direction: -1, staticChildren: ['brake'] },
    { node: 'wheel_fr', driven: false, axis: 'x', direction: -1, staticChildren: ['brake'] },
    { node: 'wheel_rl', driven: true, axis: 'x', direction: -1, staticChildren: ['brake'] },
    { node: 'wheel_rr', driven: true, axis: 'x', direction: -1, staticChildren: ['brake'] },
  ] as WheelConfig[],

  /** Raio do pneu em metros (define a relação com os rolos). */
  wheelRadius: 0.36,
  /** Distância do centro da roda até a face externa do aro (onde fica o disco de borrão). */
  wheelFaceOffset: 0.153,
  /** Posição das rodas motrizes: distância lateral do centro e eixo Z. */
  drivenTrack: 0.82,

  materials: [
    { meshes: ['body'], kind: 'paint' },
    { meshes: ['rim_fl', 'rim_fr', 'rim_rl', 'rim_rr', 'wheel'], kind: 'rim' },
    { meshes: ['glass'], kind: 'glass' },
    { meshes: ['centre', 'yellow_trim', 'steering_centre'], kind: 'accent' },
    { meshes: ['trim', 'leather', 'plastic_gray', 'grills', 'carbon_fibre', 'carbon_fibre_trim', 'blue', 'interior_dark', 'interior_light', 'carpet'], kind: 'dark' },
    // `brakes` são os anéis das lanternas (acendem); `lights_red` são as lentes e
    // refletores vermelhos espalhados pela traseira (não acendem).
    { meshes: ['brakes'], kind: 'tail' },
    { meshes: ['lights_red'], kind: 'lens' },
    { meshes: ['tire'], kind: 'tire' },
    { meshes: ['metal', 'chrome', 'brake'], kind: 'metal' },
  ] as MaterialOverride[],

  paint: {
    color: '#0c0c0e',
    metalness: 0.9,
    roughness: 0.32,
    clearcoat: 1,
    // Abaixo de ~0,1 o reflexo de um holofote passa do limite do buffer HDR
    // (vira Inf) e o bloom apaga a tela inteira.
    clearcoatRoughness: 0.11,
  },

  /** Sombra de contato pré-calculada (ambient occlusion) sob o carro. */
  shadow: {
    texture: 'textures/car-ao.png',
    size: [0.655 * 4, 1.3 * 4] as [number, number],
  },

  /** Saídas de escape, no espaço da cena: origem da distorção de calor. */
  exhaust: [0, 0.34, 2.3] as [number, number, number],

  /** Crédito obrigatório do modelo (licença CC BY). */
  credit: {
    title: 'Ferrari 458 Italia',
    author: 'vicent091036',
    license: 'CC BY (Creative Commons Attribution)',
    source: 'https://sketchfab.com/3d-models/ferrari-458-italia-57bf6cc56931426e87494f554df1dab6',
  },
};

export const dynoConfig = {
  /** Eixo traseiro do carro: onde ficam os rolos. */
  axleZ: 1.495,
  rollerRadius: 0.14,
  /** Distância de cada rolo ao eixo da roda (berço de dois rolos). */
  rollerSpacing: 0.24,
  rollerLength: 0.86,
};
