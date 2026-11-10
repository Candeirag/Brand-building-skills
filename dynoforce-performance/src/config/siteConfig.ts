/**
 * Configuração central do site.
 *
 * Tudo que é específico da empresa mora aqui: nome, telefone do WhatsApp,
 * textos, serviços, resultados e cores. Edite este arquivo — nenhum
 * componente tem dados da empresa escritos à mão.
 *
 * Há dois presets de marca:
 *  - `dynoforce`: a marca fictícia DYNOFORCE PERFORMANCE (vermelho).
 *  - `gpgarage`:  a GP Garage Performance (turquesa/prata, logo e textos reais).
 *
 * Para trocar a marca ativa: mude `DEFAULT_BRAND`, defina `VITE_BRAND` no
 * build, ou abra o site com `?brand=gpgarage` para pré-visualizar.
 */

export type BrandId = 'dynoforce' | 'gpgarage';

export const DEFAULT_BRAND: BrandId = 'dynoforce';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  details: string[];
  /** Qual composição visual acompanha o serviço. */
  visual: 'map' | 'rollers' | 'stage1' | 'stage2' | 'diagnostic' | 'custom';
}

export interface ResultItem {
  model: string;
  engine: string;
  stage: string;
  powerBefore: number;
  powerAfter: number;
  torqueBefore: number;
  torqueAfter: number;
}

export interface Pillar {
  title: string;
  text: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

export interface BrandConfig {
  id: BrandId;
  /** Nome completo, usado em títulos e na mensagem do WhatsApp. */
  name: string;
  /** Logotipo tipográfico: linha forte + linha fina. */
  wordmark: { primary: string; secondary: string };
  /** Logo em imagem (opcional). Quando existe, aparece ao lado do logotipo. */
  logoImage?: string;
  slogan: string;
  heroLines: [string, string, string];
  heroSub: string;
  tagline: string;
  colors: {
    /** Cor de destaque (CTA, redline, LEDs da cena 3D). */
    accent: string;
    /** Versão mais escura, para hover. */
    accentDeep: string;
    /** Texto sobre a cor de destaque. */
    onAccent: string;
  };
  contact: {
    /**
     * Número do WhatsApp em formato internacional, só dígitos (55 + DDD + número).
     * TROQUE antes de publicar.
     */
    whatsappPhone: string;
    /** `true` enquanto o número acima for um exemplo. Mostra um aviso no formulário. */
    whatsappIsPlaceholder: boolean;
    whatsappGreeting: string;
    instagram?: { handle: string; url: string };
    address: string;
    city: string;
    hours: string;
  };
  about: {
    title: string;
    paragraphs: string[];
    pillars: Pillar[];
    team?: TeamMember[];
  };
  closing: string;
}

const pillars: Pillar[] = [
  {
    title: 'Engenharia',
    text: 'Cada mapa parte do comportamento medido do motor, não de um arquivo pronto.',
  },
  {
    title: 'Tecnologia',
    text: 'Equipamento de leitura, bancada e dinamômetro de rolos para validar cada ajuste.',
  },
  {
    title: 'Precisão',
    text: 'Ignição, injeção e pressão de turbo acertadas faixa por faixa de rotação.',
  },
  {
    title: 'Segurança',
    text: 'Limites de temperatura, mistura e detonação respeitados em todo o projeto.',
  },
  {
    title: 'Experiência',
    text: 'Você acompanha a sessão e leva o gráfico do antes e do depois.',
  },
];

const brands: Record<BrandId, BrandConfig> = {
  dynoforce: {
    id: 'dynoforce',
    name: 'DYNOFORCE PERFORMANCE',
    wordmark: { primary: 'DYNOFORCE', secondary: 'PERFORMANCE' },
    slogan: 'LIBERE O MÁXIMO DO SEU CARRO.',
    heroLines: ['LIBERE O', 'MÁXIMO', 'DO SEU CARRO.'],
    heroSub:
      'Remap profissional, engenharia de performance e testes em dinamômetro. Mais potência, precisão e desempenho com responsabilidade.',
    tagline: 'ENGINEERING POWER.',
    colors: { accent: '#E10600', accentDeep: '#B80500', onAccent: '#F5F5F5' },
    contact: {
      whatsappPhone: '5511999999999',
      whatsappIsPlaceholder: true,
      whatsappGreeting: 'Olá! Quero agendar uma sessão na DYNOFORCE PERFORMANCE.',
      instagram: { handle: '@dynoforce.performance', url: 'https://instagram.com/' },
      address: 'Endereço da oficina (edite em siteConfig.ts)',
      city: 'Sua cidade, UF',
      hours: 'Segunda a sexta, 9h às 18h · Sábado, 9h às 13h',
    },
    about: {
      title: 'POWER IS NOTHING WITHOUT PRECISION.',
      paragraphs: [
        'Performance não é apenas aumentar números. É entender o comportamento do veículo, trabalhar com precisão e buscar o equilíbrio entre potência, resposta e confiabilidade.',
      ],
      pillars,
    },
    closing: 'Engenharia, potência e precisão em cada curva.',
  },

  gpgarage: {
    id: 'gpgarage',
    name: 'GP GARAGE PERFORMANCE',
    wordmark: { primary: 'GP GARAGE', secondary: 'PERFORMANCE' },
    logoImage: 'images/gp-garage-logo.png',
    slogan: 'LIBERE O MÁXIMO DO SEU CARRO.',
    heroLines: ['LIBERE O', 'MÁXIMO', 'DO SEU CARRO.'],
    heroSub:
      'Referência em performance e soluções automotivas em Taguatinga Sul: dinamômetro, remap, soluções eletrônicas e manutenção especializada.',
    tagline: 'TECNOLOGIA, PERFORMANCE E CONFIANÇA.',
    colors: { accent: '#6ED0CE', accentDeep: '#4FB3B1', onAccent: '#050505' },
    contact: {
      whatsappPhone: '5561999999999',
      whatsappIsPlaceholder: true,
      whatsappGreeting: 'Olá! Quero agendar uma sessão na GP Garage Performance.',
      instagram: {
        handle: '@gpgarage.performance',
        url: 'https://instagram.com/gpgarage.performance',
      },
      address: 'Taguatinga Sul',
      city: 'Brasília, DF',
      hours: 'Atendimento com hora marcada',
    },
    about: {
      title: 'POWER IS NOTHING WITHOUT PRECISION.',
      paragraphs: [
        'Na GP Garage Performance, acreditamos que desempenho, tecnologia e confiança caminham juntos. Somos uma empresa especializada em reprogramação eletrônica, diagnóstico automotivo avançado e manutenção especializada.',
        'Mais do que conhecimento técnico, compartilhamos uma paixão genuína pelo universo automotivo. É ela que nos motiva a buscar aperfeiçoamento constante e a tratar cada veículo como se fosse nosso.',
      ],
      pillars,
      team: [
        {
          name: 'Guilherme',
          role: 'Calibração e diagnóstico',
          bio: 'Especialista em desenvolvimento de softwares para centrais eletrônicas, reprogramação (remap), acerto de injeção programável e diagnóstico avançado.',
        },
        {
          name: 'Pedro',
          role: 'Comercial e relacionamento',
          bio: 'Responsável pelo atendimento, com sólido conhecimento em reprogramação e diagnóstico. Acompanha cada etapa para indicar a solução mais adequada a cada cliente.',
        },
      ],
    },
    closing: 'Tecnologia, performance e confiança em cada detalhe.',
  },
};

function resolveBrand(): BrandId {
  const isBrand = (v: unknown): v is BrandId => v === 'dynoforce' || v === 'gpgarage';
  if (typeof window !== 'undefined') {
    const fromUrl = new URLSearchParams(window.location.search).get('brand');
    if (isBrand(fromUrl)) return fromUrl;
  }
  const fromEnv = import.meta.env.VITE_BRAND;
  if (isBrand(fromEnv)) return fromEnv;
  return DEFAULT_BRAND;
}

export const brand: BrandConfig = brands[resolveBrand()];

export const navLinks = [
  { id: 'inicio', label: 'INÍCIO' },
  { id: 'remap', label: 'REMAP' },
  { id: 'dinamometro', label: 'DINAMÔMETRO' },
  { id: 'resultados', label: 'RESULTADOS' },
  { id: 'sobre', label: 'SOBRE' },
  { id: 'contato', label: 'CONTATO' },
] as const;

export const services: ServiceItem[] = [
  {
    id: 'remap-ecu',
    number: '01',
    title: 'REMAP ECU',
    description: 'Calibração eletrônica personalizada para otimizar potência e torque.',
    details: [
      'Leitura e backup do arquivo original',
      'Mapas de ignição, injeção e pressão de turbo',
      'Ajuste validado em dinamômetro',
    ],
    visual: 'map',
  },
  {
    id: 'dyno-test',
    number: '02',
    title: 'DYNO TEST',
    description: 'Medição de potência e torque em dinamômetro.',
    details: [
      'Curvas de potência e torque por rotação',
      'Leitura de mistura, pressão e temperatura',
      'Relatório da sessão em PDF',
    ],
    visual: 'rollers',
  },
  {
    id: 'stage-1',
    number: '03',
    title: 'STAGE 1',
    description: 'Preparação eletrônica com foco em desempenho e confiabilidade.',
    details: [
      'Sem alteração mecânica',
      'Margens de segurança do motor preservadas',
      'Antes e depois medidos no mesmo dia',
    ],
    visual: 'stage1',
  },
  {
    id: 'stage-2',
    number: '04',
    title: 'STAGE 2',
    description: 'Projetos de performance com modificações compatíveis.',
    details: [
      'Admissão, escape e intercooler dimensionados',
      'Calibração refeita para o novo conjunto',
      'Acompanhamento de temperatura e detonação',
    ],
    visual: 'stage2',
  },
  {
    id: 'diagnostico',
    number: '05',
    title: 'DIAGNÓSTICO',
    description: 'Análise eletrônica e diagnóstico especializado.',
    details: [
      'Leitura de falhas e parâmetros em tempo real',
      'Testes de sensores e atuadores',
      'Laudo com a causa e a correção indicada',
    ],
    visual: 'diagnostic',
  },
  {
    id: 'custom-projects',
    number: '06',
    title: 'CUSTOM PROJECTS',
    description: 'Projetos especiais de preparação automotiva.',
    details: [
      'Injeção programável e acerto fino',
      'Projetos de pista e de rua',
      'Plano de evolução por etapas',
    ],
    visual: 'custom',
  },
];

/** Opções do campo "Serviço desejado" no formulário. */
export const serviceOptions = [...services.map((s) => s.title), 'Ainda não sei, quero uma avaliação'];

/**
 * Dados ILUSTRATIVOS. Nenhum destes números é uma medição real.
 * Substitua pelos resultados medidos na oficina antes de publicar.
 */
export const results: ResultItem[] = [
  {
    model: 'BMW M340i',
    engine: '3.0 turbo, 6 cilindros',
    stage: 'Stage 1',
    powerBefore: 387,
    powerAfter: 455,
    torqueBefore: 500,
    torqueAfter: 620,
  },
  {
    model: 'Audi S3',
    engine: '2.0 TFSI',
    stage: 'Stage 1',
    powerBefore: 310,
    powerAfter: 390,
    torqueBefore: 400,
    torqueAfter: 510,
  },
  {
    model: 'VW Golf GTI',
    engine: '2.0 TSI',
    stage: 'Stage 2',
    powerBefore: 230,
    powerAfter: 330,
    torqueBefore: 350,
    torqueAfter: 480,
  },
  {
    model: 'Mercedes-AMG A 35',
    engine: '2.0 turbo',
    stage: 'Stage 1',
    powerBefore: 306,
    powerAfter: 365,
    torqueBefore: 400,
    torqueAfter: 480,
  },
];

/** Comparação da seção Dinamômetro (dados ilustrativos). */
export const dynoComparison = {
  before: { power: 320, torque: 420, powerRpm: 5800 },
  after: { power: 410, torque: 520, powerRpm: 5900 },
  redline: 6800,
};

/** Puxada de demonstração do hero (dados ilustrativos). */
export const heroRun = {
  idleRpm: 900,
  redline: 6800,
  peakPower: 520,
  peakPowerRpm: 6200,
  peakTorque: 650,
  peakBoost: 1.8,
  topSpeed: 212,
};

export const audioConfig = {
  /**
   * Por padrão o som do motor é sintetizado no navegador (Web Audio), sem
   * arquivo. Para usar uma gravação própria ou licenciada, coloque um loop em
   * `public/audio/` e informe o caminho aqui (ex.: 'audio/engine-loop.mp3').
   * O loop é tocado com o tom acompanhando o RPM.
   */
  src: null as string | null,
  /** RPM em que o loop foi gravado (só usado com `src`). */
  sampleRpm: 3000,
  /** Volume inicial, de 0 a 1. */
  volume: 0.5,
  /** Cilindros do motor sintetizado. */
  cylinders: 8,
};

/** Monta o link do WhatsApp com a mensagem pronta. */
export function whatsappUrl(message: string = brand.contact.whatsappGreeting): string {
  return `https://wa.me/${brand.contact.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
