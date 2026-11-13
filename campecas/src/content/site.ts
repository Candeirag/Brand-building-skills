/**
 * Todo o conteúdo editável do site mora aqui.
 *
 * Tudo que está entre colchetes — [ENDEREÇO], [HORÁRIO], [@PERFIL],
 * [DEPOIMENTO REAL AQUI] — é placeholder: troque pelo dado real.
 * Enquanto um campo for placeholder, o site se adapta sozinho
 * (o mapa não carrega, o JSON-LD omite o campo, etc.).
 */

/** true enquanto o valor ainda for um placeholder entre colchetes. */
export const isPlaceholder = (value: string) => /\[[^\]]*\]/.test(value);

export const site = {
  name: "Campeças",
  fullName: "Campeças – Peças e Serviços",
  tagline: "Do amassado ao espelhado.",
  description:
    "Oficina de família no DF. Lanternagem, pintura e mecânica com acabamento de quem cuida do próprio carro. Peça seu orçamento pelo WhatsApp.",
  region: "DF",

  /**
   * WhatsApp da oficina, confirmado pelo cliente (é o celular do logo).
   * `number` só com dígitos, com 55 + DDD. Para voltar ao placeholder, use "[NÚMERO]":
   * os botões passam a levar para a seção de contato em vez do WhatsApp.
   */
  whatsapp: {
    number: "5561998649037",
    display: "(61) 99864-9037",
    message: "Olá! Vim pelo site da Campeças e quero um orçamento.",
  },

  /** Telefone fixo (também está no logo). */
  phone: {
    number: "+556135755864",
    display: "(61) 3575-5864",
  },

  address: "[ENDEREÇO], DF",
  hours: "[HORÁRIO]",
  instagram: "[@PERFIL]",
} as const;

/* ------------------------------------------------------------------ navegação */

export const nav = [
  { label: "Antes → Depois", href: "#transformacao" },
  { label: "Serviços", href: "#servicos" },
  { label: "Processo", href: "#processo" },
  { label: "Galeria", href: "#galeria" },
  { label: "Contato", href: "#contato" },
] as const;

/* ----------------------------------------------------------------------- hero */

export const hero = {
  scene: "02",
  slug: "INT. OFICINA CAMPEÇAS — NOITE",
  titleLines: ["Do amassado", "ao espelhado."],
  subtitle:
    "Lanternagem, pintura e mecânica no DF. Oficina de família: seu carro sai daqui melhor do que entrou.",
  cta: "Orçamento no WhatsApp",
  video: "/media/hero.mp4",
  poster: "/media/hero-poster.jpg",
} as const;

/* -------------------------------------------------------------- antes → depois */

export const transformation = {
  scene: "03",
  slug: "INT. CABINE DE PINTURA — NOITE",
  title: "Antes → Depois",
  lead: "A mesma porta, quatro etapas. Role devagar.",
  stages: [
    {
      label: "Desamassar",
      text: "A lata volta para a linha original. No martelo, no tasso e na paciência.",
      image: "/media/transformacao-01-amassado.jpg",
      alt: "Porta do carro amassada e riscada, como chegou à oficina.",
    },
    {
      label: "Preparar",
      text: "Massa, lixa e primer até a superfície ficar lisa de passar a mão de olho fechado.",
      image: "/media/transformacao-02-preparado.jpg",
      alt: "A mesma porta desamassada, com massa e primer, mascarada para a pintura.",
    },
    {
      label: "Pintar",
      text: "Cor acertada no tom do carro, aplicada com calma, camada por camada.",
      image: "/media/transformacao-03-pintado.jpg",
      alt: "A mesma porta já pintada, com a cor uniforme.",
    },
    {
      label: "Polir",
      text: "Verniz, polimento e conferência na luz. Só sai quando espelha.",
      image: "/media/transformacao-04-polido.jpg",
      alt: "A mesma porta polida, refletindo as luzes como um espelho.",
    },
  ],
} as const;

/* ------------------------------------------------------- serviços (capítulos) */

export const chapters = {
  scene: "04",
  items: [
    {
      id: "lanternagem",
      title: "Lanternagem",
      line: "Amassou, riscou, bateu? A lata volta para o lugar.",
      text: "Do toque de estacionamento à colisão. Alinhamos, desamassamos e recuperamos a peça antes de pensar em trocar.",
      items: ["Desamassamento e alinhamento", "Reparo de colisão", "Troca e ajuste de peças de lataria"],
      image: "/media/lanternagem.jpg",
      alt: "Lanterneiro alinhando a lateral de um carro com martelo e tasso.",
      whatsapp: "Olá! Vim pelo site e quero um orçamento de lanternagem.",
    },
    {
      id: "pintura",
      title: "Pintura",
      line: "Cor no tom exato. Brilho de vitrine.",
      text: "Preparação caprichada, tinta aplicada sem pressa e polimento até a luz correr inteira pela lataria.",
      items: ["Pintura parcial e geral", "Acerto de cor", "Polimento e espelhamento"],
      image: "/media/pintura.jpg",
      alt: "Pintor aplicando tinta em um carro, com a névoa contra a luz.",
      whatsapp: "Olá! Vim pelo site e quero um orçamento de pintura.",
    },
    {
      id: "mecanica",
      title: "Mecânica",
      line: "Bonito por fora, redondo por dentro.",
      text: "Diagnóstico honesto e serviço bem-feito. A gente explica o que precisa ser feito agora e o que pode esperar.",
      items: ["Revisão e manutenção", "Freios e suspensão", "Diagnóstico de motor"],
      image: "/media/mecanica.jpg",
      alt: "Mãos de um mecânico trabalhando no motor com o capô aberto.",
      whatsapp: "Olá! Vim pelo site e quero um orçamento de mecânica.",
    },
    {
      id: "pecas",
      title: "Peças",
      line: "A peça certa, sem você rodar a cidade.",
      text: "Peças para lataria, acabamento e mecânica, indicadas por quem instala todo dia.",
      items: ["Lataria e acabamento", "Mecânica", "Orientação de quem instala"],
      image: "/media/pecas.jpg",
      alt: "Peças novas alinhadas em uma prateleira da oficina.",
      whatsapp: "Olá! Vim pelo site e estou procurando uma peça.",
    },
  ],
} as const;

/* ------------------------------------------------------------------- processo */

export const process = {
  scene: "05",
  slug: "INT. RECEPÇÃO — DIA",
  title: "Da chave na mão à chave de volta.",
  lead: "Cinco passos, sem atalho.",
  steps: [
    {
      id: "recebimento",
      title: "Recebimento",
      text: "Você chega, a gente olha o carro junto com você e anota tudo.",
    },
    {
      id: "diagnostico",
      title: "Diagnóstico",
      text: "Levantamos o que precisa ser feito. E o que não precisa.",
    },
    {
      id: "orcamento",
      title: "Orçamento",
      text: "Valor e prazo combinados antes de começar. Sem surpresa na entrega.",
    },
    {
      id: "execucao",
      title: "Execução",
      text: "Mão na massa, etapa por etapa, sem pular nenhuma.",
    },
    {
      id: "entrega",
      title: "Entrega",
      text: "Conferimos o carro com você, na luz. Só então a chave volta para a sua mão.",
    },
  ],
} as const;

/* -------------------------------------------------------------------- números */

/**
 * ATENÇÃO: valores de exemplo. Troque `value` pelo número real e mude
 * `placeholder` para false; a etiqueta "valor de exemplo" some sozinha.
 */
export const numbers = {
  scene: "06",
  slug: "INSERT — PAINEL",
  title: "Em números.",
  items: [
    { value: 20, prefix: "+", suffix: "", label: "anos de oficina", placeholder: true },
    { value: 5000, prefix: "+", suffix: "", label: "carros entregues", placeholder: true },
    { value: 12, prefix: "", suffix: " meses", label: "de garantia na pintura", placeholder: true },
    { value: 4, prefix: "", suffix: "", label: "especialidades sob o mesmo teto", placeholder: false },
  ],
} as const;

/* -------------------------------------------------------------------- galeria */

/** Legendas provisórias: ajuste para o carro e o serviço de cada foto real. */
export const gallery = {
  scene: "07",
  slug: "MONTAGEM — CARROS ENTREGUES",
  title: "Saíram daqui.",
  leadHover: "Passe o mouse para ver como chegaram. Clique para ampliar.",
  leadTouch: "Toque em uma foto para ver o antes e o depois.",
  items: [
    { id: "01", caption: "Lateral traseira" },
    { id: "02", caption: "Para-choque dianteiro" },
    { id: "03", caption: "Porta do motorista" },
    { id: "04", caption: "Capô" },
    { id: "05", caption: "Para-lama" },
    { id: "06", caption: "Tampa traseira" },
  ].map((item) => ({
    ...item,
    before: `/media/trabalho-${item.id}-antes.jpg`,
    after: `/media/trabalho-${item.id}-depois.jpg`,
  })),
};

/* ------------------------------------------------------------------- quem faz */

export const family = {
  scene: "08",
  slug: "INT. OFICINA — FIM DE TARDE",
  title: "A gente assina embaixo.",
  paragraphs: [
    "A Campeças é oficina de família. Quem recebe o seu carro é quem responde por ele até a entrega.",
    "Sem pressa de linha de montagem e sem empurrar serviço que não precisa. Fazemos no seu carro o que faríamos no nosso.",
  ],
  /** Placeholder: conte aqui a história real (quem fundou, desde quando, quem toca hoje). */
  story: "[HISTÓRIA DA FAMÍLIA AQUI: quem fundou, desde quando, quem toca a oficina hoje]",
  image: "/media/familia.jpg",
  alt: "Retrato da família que toca a oficina Campeças.",
  caption: "Família Campeças",
} as const;

/* ---------------------------------------------------------------- depoimentos */

/**
 * Só a estrutura. NÃO invente depoimentos: cole aqui o texto real,
 * com autorização do cliente, e troque os campos entre colchetes.
 */
export const testimonials = {
  scene: "09",
  slug: "PLANO FECHADO — QUEM JÁ PASSOU POR AQUI",
  title: "A palavra é do cliente.",
  items: [
    { quote: "[DEPOIMENTO REAL AQUI]", author: "[NOME DO CLIENTE]", detail: "[CARRO · SERVIÇO]" },
    { quote: "[DEPOIMENTO REAL AQUI]", author: "[NOME DO CLIENTE]", detail: "[CARRO · SERVIÇO]" },
    { quote: "[DEPOIMENTO REAL AQUI]", author: "[NOME DO CLIENTE]", detail: "[CARRO · SERVIÇO]" },
  ],
} as const;

/* ------------------------------------------------------------ final + contato */

export const finale = {
  scene: "10",
  slug: "EXT. FACHADA DA OFICINA — DIA",
  titleLines: ["Seu carro sai daqui", "melhor do que entrou."],
  lead: "Mande uma foto do carro pelo WhatsApp e conte o que aconteceu. A gente responde com o caminho.",
  cta: "Orçamento no WhatsApp",
} as const;

export const credits = {
  heading: "Créditos finais",
  rows: [
    { role: "Lanternagem", name: "Campeças" },
    { role: "Pintura", name: "Campeças" },
    { role: "Mecânica", name: "Campeças" },
    { role: "Peças", name: "Campeças" },
    { role: "Elenco principal", name: "Seu carro" },
    { role: "Locação", name: site.address },
    { role: "Sessões", name: site.hours },
    { role: "Produção", name: "Uma oficina de família" },
  ],
  disclaimer: "Nenhum carro foi maltratado durante esta produção.",
  end: "Fim",
} as const;
