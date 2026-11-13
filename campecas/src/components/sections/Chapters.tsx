"use client";

import { useRef } from "react";
import Image from "next/image";
import { chapters } from "@/content/site";
import { EASE, gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useNear } from "@/lib/hooks";
import { announceScene } from "@/lib/scene";
import { whatsappLinkProps } from "@/components/ui/WhatsAppButton";
import { ArrowIcon } from "@/components/ui/icons";

const { items } = chapters;
const total = String(items.length).padStart(2, "0");

/** Entrada do texto de um capítulo (roda a cada corte). */
function buildEntrance(panel: HTMLElement) {
  const select = gsap.utils.selector(panel);
  return gsap
    .timeline({ paused: true, defaults: { ease: EASE.out } })
    .from(select(".chapter-number-in"), { yPercent: 22, opacity: 0, duration: 1.6 }, 0)
    .from(select(".chapter-title"), { yPercent: 112, duration: 1.2 }, 0.05)
    .from(select(".chapter-reveal"), { y: 26, opacity: 0, duration: 1.1, stagger: 0.07 }, 0.25);
}

/**
 * CENA 04 — serviços como capítulos.
 * Telas grandes: um palco fixado em que o capítulo troca em CORTE SECO (sem transição),
 * com um quadro de flash e a entrada do texto a cada corte.
 * Celular, tablet e movimento reduzido: os capítulos ficam empilhados, uma tela cada.
 */
export function Chapters() {
  const root = useRef<HTMLElement>(null);
  const near = useNear(root);

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);
      const panels = gsap.utils.toArray<HTMLElement>(".chapter");
      const announce = (index: number) => announceScene({ scene: chapters.scene, title: items[index].title });

      /* ---------- desktop: palco fixado, cortes secos ---------- */
      media.add(MQ.stage, () => {
        const entrances = panels.map(buildEntrance);
        const images = panels.map((panel) => panel.querySelector(".chapter-image"));
        const numbers = panels.map((panel) => panel.querySelector(".chapter-number"));
        let current = -1;

        const cut = (index: number, withFlash: boolean) => {
          if (index === current) return;
          current = index;
          gsap.set(panels, { autoAlpha: (i: number) => (i === index ? 1 : 0) });
          if (withFlash) {
            gsap.fromTo(".chapter-flash", { opacity: 0.55 }, { opacity: 0, duration: 0.5, ease: EASE.soft, overwrite: true });
          }
          entrances[index].restart();
        };

        cut(0, false);

        ScrollTrigger.create({
          trigger: ".chapters-stage",
          start: "top top",
          end: () => `+=${window.innerHeight * panels.length}`,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const raw = self.progress * panels.length;
            const index = Math.min(panels.length - 1, Math.floor(raw));
            const local = raw - index;
            if (index !== current) {
              cut(index, true);
              announce(index);
            }
            // parallax dentro do capítulo
            gsap.set(images[index], { yPercent: -5 + local * 10, scale: 1.14 - local * 0.05 });
            gsap.set(numbers[index], { yPercent: local * -14 });
          },
        });

        ScrollTrigger.create({
          trigger: root.current,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) announce(Math.max(current, 0));
          },
        });
      });

      /* ---------- empilhado: legenda de cena por capítulo ---------- */
      media.add(MQ.stacked, () => {
        panels.forEach((panel, index) => {
          ScrollTrigger.create({
            trigger: panel,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (self.isActive) announce(index);
            },
          });
        });
      });

      /* ---------- empilhado com movimento: entrada + parallax leve ---------- */
      media.add(MQ.stackedMotion, () => {
        panels.forEach((panel) => {
          const entrance = buildEntrance(panel);
          ScrollTrigger.create({ trigger: panel, start: "top 62%", once: true, onEnter: () => entrance.play() });
          gsap.fromTo(
            panel.querySelector(".chapter-image"),
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="servicos" aria-labelledby="servicos-titulo" className="relative bg-ink">
      <h2 id="servicos-titulo" className="sr-only">
        Serviços
      </h2>

      <div className="chapters-stage relative stage:h-svh stage:overflow-hidden">
        {items.map((chapter, index) => {
          const number = String(index + 1).padStart(2, "0");
          const { external, ...link } = whatsappLinkProps(chapter.whatsapp);
          return (
            <article
              key={chapter.id}
              id={chapter.id}
              aria-labelledby={`${chapter.id}-titulo`}
              className="chapter relative grid overflow-hidden border-t border-black bg-ink lg:min-h-svh lg:grid-cols-2 stage:absolute stage:inset-0 stage:border-0"
            >
              {/* imagem grande; o lado alterna a cada capítulo, como plano e contraplano */}
              <div
                className={`relative h-[44svh] min-h-72 overflow-hidden lg:h-auto ${index % 2 === 0 ? "lg:order-2" : ""}`}
                data-cursor="media"
              >
                <div className="chapter-image absolute inset-x-0 -inset-y-[8%]">
                  <Image
                    src={chapter.image}
                    alt={chapter.alt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    loading={near ? "eager" : "lazy"}
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="px-gutter relative flex flex-col justify-end pt-10 pb-16 lg:pt-[calc(var(--bar)+2rem)] lg:pb-[calc(var(--bar)+3rem)]">
                {/* número do capítulo, gigante, ao fundo */}
                <div
                  className="chapter-number pointer-events-none absolute top-4 right-(--gutter) select-none lg:top-[calc(var(--bar)+3.5rem)]"
                  aria-hidden="true"
                >
                  <span className="chapter-number-in display block text-[38vw] leading-[0.8] text-bone/8 lg:text-[46vh]">
                    {number}
                  </span>
                </div>

                <div className="relative">
                  <p className="chapter-reveal label flex items-center gap-3 text-ash">
                    <span className="text-bone">Cena {chapters.scene}</span>
                    <span className="h-px w-8 bg-red" aria-hidden="true" />
                    <span>
                      Cap. {number} / {total}
                    </span>
                  </p>
                  <h3
                    id={`${chapter.id}-titulo`}
                    className="display -my-[0.04em] overflow-hidden py-[0.18em] text-[min(calc((100vw-2*var(--gutter))/5.5),8rem)] whitespace-nowrap lg:text-[min(calc((50vw-2*var(--gutter))/5.5),16svh)]"
                  >
                    <span className="chapter-title block">{chapter.title}</span>
                  </h3>
                  <p className="chapter-reveal max-w-[24ch] text-2xl leading-tight font-medium text-bone md:text-3xl">
                    {chapter.line}
                  </p>
                  <p className="chapter-reveal mt-4 max-w-[44ch] text-base text-bone/85 md:text-lg">{chapter.text}</p>
                  <ul className="chapter-reveal mt-6 flex flex-col gap-2 text-sm font-medium text-bone md:text-base">
                    {chapter.items.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="h-px w-5 shrink-0 bg-red" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    {...link}
                    className="chapter-reveal group label mt-8 inline-flex items-center gap-3 border-b border-red py-3 text-bone"
                  >
                    Orçamento de {chapter.title.toLowerCase()}
                    <ArrowIcon className="size-4 transition-transform duration-500 ease-cine group-hover:translate-x-1.5" />
                    {external && <span className="sr-only"> (abre o WhatsApp em nova aba)</span>}
                  </a>
                </div>
              </div>
            </article>
          );
        })}
        <div
          className="chapter-flash pointer-events-none absolute inset-0 z-10 hidden bg-bone opacity-0 stage:block"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
