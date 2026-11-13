"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { transformation } from "@/content/site";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { useNear, useReducedMotion } from "@/lib/hooks";
import { useCinema } from "@/components/cinema/SmoothScroll";
import { SceneHeading } from "@/components/ui/SceneHeading";
import { ArrowIcon } from "@/components/ui/icons";

const { stages } = transformation;
const [before, after] = transformation.title.split("→").map((part) => part.trim());

/** Tempos da timeline (em "unidades" de scrub). */
const INTRO = 0.25;
const WIPE = 1;
const HOLD = 0.4;
const OUTRO = 0.5;
const wipeStart = (wipe: number) => INTRO + wipe * (WIPE + HOLD);
const TOTAL = wipeStart(stages.length - 1) - HOLD + OUTRO;

/**
 * CENA 03 — o carro amassado vira o carro restaurado conforme a rolagem.
 * Cada etapa entra por uma máscara que desliza (overflow hidden) enquanto a imagem
 * interna desliza no sentido contrário: só transform, sem clip-path.
 * Sem movimento (prefers-reduced-motion), as etapas viram botões.
 */
export function BeforeAfter() {
  const root = useRef<HTMLElement>(null);
  const seek = useRef<((stage: number) => void) | null>(null);
  const [stage, setStage] = useState(0);
  const reduced = useReducedMotion();
  const near = useNear(root);
  const { scrollTo } = useCinema();

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);

      media.add(MQ.motion, () => {
        const masks = gsap.utils.toArray<HTMLElement>(".ba-mask").slice(1);

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          // a legenda acompanha o que está na tela (a timeline), não a posição crua da rolagem
          onUpdate: () => {
            const time = timeline.time();
            setStage(masks.filter((_, wipe) => time >= wipeStart(wipe) + WIPE / 2).length);
          },
          scrollTrigger: {
            trigger: ".ba-stage",
            start: "top top",
            end: () => `+=${window.innerHeight * (window.innerWidth < 1024 ? 2.4 : 3.2)}`,
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline.fromTo(".ba-progress", { scaleX: 0 }, { scaleX: 1, duration: TOTAL }, 0);

        masks.forEach((mask, wipe) => {
          const at = wipeStart(wipe);
          timeline
            .fromTo(mask, { xPercent: -100 }, { xPercent: 0, duration: WIPE }, at)
            .fromTo(mask.querySelector(".ba-inner"), { xPercent: 100 }, { xPercent: 0, duration: WIPE }, at)
            .fromTo(mask.querySelector(".ba-light"), { opacity: 0 }, { opacity: 1, duration: 0.05 }, at)
            .to(mask.querySelector(".ba-light"), { opacity: 0, duration: 0.05 }, at + WIPE - 0.05);
        });

        // Clicar numa etapa leva a rolagem até o ponto em que ela está completa.
        seek.current = (target) => {
          const trigger = timeline.scrollTrigger;
          if (!trigger) return;
          const time = target === 0 ? 0 : wipeStart(target - 1) + WIPE + HOLD / 2;
          scrollTo(trigger.start + (trigger.end - trigger.start) * Math.min(time / TOTAL, 1));
        };

        return () => {
          seek.current = null;
          setStage(0);
        };
      });
    },
    { scope: root },
  );

  const status = stage === 0 ? "Antes" : stage === stages.length - 1 ? "Depois" : "Em obra";

  return (
    <section
      ref={root}
      id="transformacao"
      data-scene={transformation.scene}
      data-scene-title={transformation.title}
      aria-labelledby="transformacao-titulo"
      className="relative bg-ink"
    >
      <div className="ba-stage relative flex h-svh min-h-[38rem] flex-col overflow-hidden">
        {/* quadro: as quatro etapas empilhadas */}
        <div className="absolute inset-0">
          {stages.map((item, index) => (
            <div
              key={item.label}
              className="ba-mask absolute inset-0 overflow-hidden"
              style={reduced ? { opacity: index <= stage ? 1 : 0 } : undefined}
            >
              <div className="ba-inner absolute inset-0">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="100vw"
                  loading={near ? "eager" : "lazy"}
                  className="object-cover"
                />
              </div>
              {index > 0 && (
                <span className="ba-light absolute inset-y-0 right-0 w-28 opacity-0" aria-hidden="true">
                  <span className="absolute inset-0 bg-[linear-gradient(to_left,rgb(237_233_227/0.28),transparent)]" />
                  <span className="absolute inset-y-0 right-0 w-0.5 bg-bone shadow-[0_0_24px_4px_rgb(237_233_227/0.6)]" />
                </span>
              )}
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(11_11_12/0.82)_0%,rgb(11_11_12/0.25)_30%,rgb(11_11_12/0.1)_48%,rgb(11_11_12/0.88)_82%,var(--color-ink)_100%)]"
          aria-hidden="true"
        />

        <div className="px-gutter relative flex flex-1 flex-col pt-[calc(var(--bar)+1.25rem)] pb-[calc(var(--bar)+1rem)] md:pt-[calc(var(--bar)+2rem)] md:pb-[calc(var(--bar)+1.5rem)]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <SceneHeading scene={transformation.scene} slug={transformation.slug} />
              <h2
                id="transformacao-titulo"
                aria-label={`${before} e ${after}`}
                className="display mt-4 flex flex-wrap items-center gap-x-[0.28em] text-5xl md:text-7xl"
              >
                <span aria-hidden="true">{before}</span>
                <ArrowIcon className="size-[0.62em] text-red" />
                <span aria-hidden="true">{after}</span>
              </h2>
              <p className="mt-3 max-w-[30ch] text-base text-bone/90 md:text-lg">
                {reduced ? "A mesma porta, quatro etapas. Escolha uma etapa abaixo." : transformation.lead}
              </p>
            </div>
            <p className="label mt-0.5 hidden shrink-0 items-center gap-2 border border-bone/25 bg-ink/60 px-3 py-2 text-bone sm:flex" aria-hidden="true">
              <span className="size-1.5 bg-red" />
              {status}
            </p>
          </div>

          <div className="mt-auto">
            {/* legenda da etapa ativa */}
            <div className="grid" aria-live="polite">
              {stages.map((item, index) => (
                <div
                  key={item.label}
                  aria-hidden={index !== stage}
                  className={`col-start-1 row-start-1 flex flex-col gap-x-10 gap-y-2 transition-opacity duration-500 ease-cine motion-reduce:transition-none md:flex-row md:items-end ${
                    index === stage ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <p className="display flex items-baseline gap-[0.3em] text-[clamp(3.25rem,12vw,9.5rem)]">
                    <span className="tabular text-[0.3em] text-ash">{String(index + 1).padStart(2, "0")}</span>
                    {item.label}
                  </p>
                  <p className="max-w-[36ch] text-base text-bone/90 md:pb-[1.4vw] md:text-lg">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 h-px bg-bone/20" aria-hidden="true">
              <div
                className="ba-progress h-px origin-left bg-red"
                style={reduced ? { transform: `scaleX(${(stage + 1) / stages.length})` } : undefined}
              />
            </div>

            <ol className="mt-1 grid grid-cols-4 gap-2">
              {stages.map((item, index) => (
                <li key={item.label}>
                  <button
                    type="button"
                    aria-current={index === stage ? "step" : undefined}
                    onClick={() => (seek.current ? seek.current(index) : setStage(index))}
                    className={`label flex w-full flex-col gap-1.5 py-3 text-left tracking-[0.08em] transition-opacity duration-500 md:flex-row md:gap-3 md:tracking-[0.16em] ${
                      index === stage ? "text-bone opacity-100" : "text-bone opacity-55 hover:opacity-100"
                    }`}
                  >
                    <span className="text-ash">{String(index + 1).padStart(2, "0")}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
