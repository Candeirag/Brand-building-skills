"use client";

import { useRef } from "react";
import { workflow } from "@/content/site";
import { EASE, gsap, MQ, useGSAP } from "@/lib/gsap";
import { SceneHeading } from "@/components/ui/SceneHeading";

type StepId = (typeof workflow.steps)[number]["id"];

/* ---------------------------------------------------------------------------
   Microanimações: desenhos técnicos simples, movidos só por transform e opacity.
   --------------------------------------------------------------------------- */

function StepArt({ id }: { id: StepId }) {
  const svg = {
    viewBox: "0 0 160 120",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    className: "size-full text-bone",
    "aria-hidden": true,
    focusable: false,
  } as const;

  switch (id) {
    case "recebimento": // a chave chega, a ficha é preenchida
      return (
        <svg {...svg}>
          <g className="art-key">
            <circle cx="38" cy="60" r="14" />
            <circle cx="38" cy="60" r="4" />
            <path d="M52 60h42M80 60v9M88 60v6" />
          </g>
          <rect className="art-sheet" x="108" y="34" width="36" height="52" />
          <path className="art-line" d="M114 46h24" />
          <path className="art-line" d="M114 56h24" />
          <path className="art-line stroke-red" d="M114 66h14" />
        </svg>
      );
    case "diagnostico": // uma linha de luz varre a porta e a mira fecha no amassado
      return (
        <svg {...svg}>
          <path d="M22 88V52c0-10 8-18 18-18h68c16 0 30 12 30 30v24z" />
          <path d="M22 58h112" opacity="0.35" />
          <path className="stroke-red" d="M70 76c6-7 16-7 22 0" />
          <g className="art-target">
            <circle cx="81" cy="73" r="13" />
            <path d="M81 54v8M81 84v8M62 73h8M92 73h8" />
          </g>
          <path className="art-scan stroke-red" d="M22 26v68" />
        </svg>
      );
    case "orcamento": // itens conferidos um a um, total fechado
      return (
        <svg {...svg}>
          <rect x="42" y="16" width="76" height="88" />
          {[34, 50, 66].map((y) => (
            <g key={y}>
              <path className="art-line" d={`M52 ${y}h36`} />
              <path className="art-tick stroke-red" d={`M98 ${y}l3 3 6-7`} />
            </g>
          ))}
          <path className="art-total stroke-red" strokeWidth="3" d="M52 88h56" />
        </svg>
      );
    case "execucao": // a lixadeira gira, as faíscas saem
      return (
        <svg {...svg}>
          <g className="art-disc">
            <circle cx="68" cy="62" r="30" />
            <circle cx="68" cy="62" r="6" />
            <path d="M68 32v10M68 82v10M38 62h10M88 62h10M47 41l7 7M82 76l7 7M47 83l7-7M82 48l7-7" />
          </g>
          <g className="stroke-red">
            <path className="art-spark" d="M102 78l10 5" />
            <path className="art-spark" d="M104 69l14 1" />
            <path className="art-spark" d="M101 87l8 9" />
            <path className="art-spark" d="M106 60l11-5" />
          </g>
        </svg>
      );
    case "entrega": // a luz corre pela lataria pronta
      return (
        <svg {...svg}>
          <defs>
            <clipPath id="art-entrega-clip">
              <rect x="26" y="32" width="108" height="60" />
            </clipPath>
          </defs>
          <rect x="26" y="32" width="108" height="60" />
          <g clipPath="url(#art-entrega-clip)">
            <path className="art-shine" d="M-30 100L0 24h16l-30 76z" fill="currentColor" stroke="none" opacity="0.4" />
          </g>
          <path className="art-star stroke-red" d="M122 14v16M114 22h16" />
        </svg>
      );
  }
}

/** Timeline de um passo: texto + desenho. Toca enquanto o passo está na tela. */
function buildStep(step: HTMLElement, id: StepId) {
  const select = gsap.utils.selector(step);
  const timeline = gsap
    .timeline({ paused: true, defaults: { ease: EASE.out } })
    .from(select(".step-reveal"), { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, 0)
    .from(select(".step-frame"), { opacity: 0, duration: 1.2, ease: EASE.soft }, 0);

  switch (id) {
    case "recebimento":
      timeline
        .from(select(".art-key"), { x: -46, rotation: -30, opacity: 0, svgOrigin: "38 60", duration: 1.4 }, 0.2)
        .from(select(".art-sheet"), { opacity: 0, y: 8, duration: 0.9 }, 0.7)
        .from(select(".art-line"), { scaleX: 0, transformOrigin: "left center", duration: 0.8, stagger: 0.14 }, 0.95);
      break;
    case "diagnostico":
      timeline
        .from(select(".art-target"), { scale: 2.4, opacity: 0, svgOrigin: "81 73", duration: 1.3 }, 0.5)
        .fromTo(
          select(".art-scan"),
          { x: 0 },
          { x: 116, duration: 1.9, ease: "sine.inOut", repeat: -1, yoyo: true },
          0.2,
        );
      break;
    case "orcamento":
      timeline
        .from(select(".art-line"), { scaleX: 0, transformOrigin: "left center", duration: 0.8, stagger: 0.2 }, 0.3)
        .from(select(".art-tick"), { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.6, stagger: 0.2 }, 0.6)
        .from(select(".art-total"), { scaleX: 0, transformOrigin: "left center", duration: 1 }, 1.3);
      break;
    case "execucao":
      timeline
        .to(select(".art-disc"), { rotation: 360, svgOrigin: "68 62", duration: 2.6, ease: "none", repeat: -1 }, 0)
        .fromTo(
          select(".art-spark"),
          { x: -8, opacity: 0 },
          {
            keyframes: { x: [-8, 6, 22], opacity: [0, 1, 0] },
            duration: 0.75,
            ease: "none",
            stagger: { each: 0.17, repeat: -1 },
          },
          0.3,
        );
      break;
    case "entrega":
      timeline
        .from(select(".art-star"), { scale: 0, rotation: -90, opacity: 0, svgOrigin: "122 22", duration: 1.1 }, 0.6)
        .fromTo(
          select(".art-shine"),
          { x: 0 },
          { x: 200, duration: 1.7, ease: "power2.inOut", repeat: -1, repeatDelay: 1.3 },
          0.4,
        );
      break;
  }

  return timeline;
}

/**
 * CENA 05 — o processo.
 * Desktop: linha do tempo horizontal fixada (a rolagem vertical move a trilha).
 * Celular, tablet e movimento reduzido: linha do tempo vertical, sem pin.
 */
export function Process() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);

      // Cada passo anima enquanto está visível (vale para a trilha horizontal e a vertical).
      media.add(MQ.motion, () => {
        const steps = gsap.utils.toArray<HTMLElement>(".process-step");
        const timelines = new Map(steps.map((step) => [step, buildStep(step, step.dataset.step as StepId)]));
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const timeline = timelines.get(entry.target as HTMLElement);
              if (entry.isIntersecting) timeline?.play();
              else timeline?.pause();
            });
          },
          { threshold: 0.3 },
        );
        steps.forEach((step) => observer.observe(step));

        gsap.from(".process-head", {
          y: 36,
          opacity: 0,
          duration: 1.3,
          ease: EASE.out,
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });

        return () => observer.disconnect();
      });

      media.add(MQ.stage, () => {
        const track = root.current?.querySelector<HTMLElement>(".process-track");
        if (!track) return;
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: ".process-stage",
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .to(track, { x: () => -distance() }, 0)
          .fromTo(".process-progress", { scaleX: 0 }, { scaleX: 1 }, 0);
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="processo"
      data-scene={workflow.scene}
      data-scene-title="O processo"
      aria-labelledby="processo-titulo"
      className="relative bg-graphite"
    >
      <div className="process-stage relative flex flex-col py-24 lg:py-32 stage:h-svh stage:overflow-hidden stage:pt-[calc(var(--bar)+2.5rem)] stage:pb-[calc(var(--bar)+2rem)]">
        <header className="px-gutter">
          <SceneHeading scene={workflow.scene} slug={workflow.slug} className="process-head" />
          <h2
            id="processo-titulo"
            className="process-head display mt-4 max-w-[16ch] text-5xl text-balance md:text-7xl stage:text-[min(4.5rem,9svh)]"
          >
            {workflow.title}
          </h2>
          <p className="process-head mt-3 text-base text-bone/90 md:text-lg">{workflow.lead}</p>
        </header>

        <div className="relative mt-14 stage:mt-auto">
          <div className="absolute inset-x-0 top-0 hidden h-px bg-steel stage:block" aria-hidden="true">
            <div className="process-progress h-px origin-left bg-red" />
          </div>
          <ol className="process-track px-gutter flex flex-col stage:w-max stage:flex-row stage:pr-[16vw]">
            {workflow.steps.map((step, index) => (
              <li
                key={step.id}
                data-step={step.id}
                className="process-step relative grid grid-cols-[5.5rem_1fr] gap-x-5 border-l border-steel pb-12 pl-5 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-x-8 sm:pl-8 stage:block stage:w-[36vw] stage:pt-9 stage:pr-10 stage:pb-0"
              >
                <span className="absolute top-0 -left-[3px] size-[5px] bg-red" aria-hidden="true" />
                <div className="step-frame aspect-4/3 w-full self-start border border-steel bg-ink/50 p-2 stage:w-[min(15rem,22svh)]">
                  <StepArt id={step.id} />
                </div>
                <div className="stage:mt-6">
                  <p className="step-reveal label text-ash">
                    Passo {String(index + 1).padStart(2, "0")} / {String(workflow.steps.length).padStart(2, "0")}
                  </p>
                  <h3 className="step-reveal display mt-2 text-4xl md:text-5xl">{step.title}</h3>
                  <p className="step-reveal mt-3 max-w-[32ch] text-base text-bone/85 md:text-lg">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
