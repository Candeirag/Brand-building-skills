"use client";

import { useRef } from "react";
import { numbers } from "@/content/site";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { useReveal } from "@/lib/reveal";
import { SceneHeading } from "@/components/ui/SceneHeading";

const format = new Intl.NumberFormat("pt-BR");

/** CENA 06 — contadores. Os valores vêm de site.ts; os de exemplo ficam marcados. */
export function Numbers() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);
      media.add(MQ.motion, () => {
        const values = gsap.utils.toArray<HTMLElement>(".number-value");
        values.forEach((element) => {
          const end = Number(element.dataset.value);
          const counter = { value: 0 };
          element.textContent = "0";
          gsap.to(counter, {
            value: end,
            duration: 2.4,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
            onUpdate: () => {
              element.textContent = format.format(Math.round(counter.value));
            },
          });
        });
        return () => {
          values.forEach((element) => {
            element.textContent = format.format(Number(element.dataset.value));
          });
        };
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="numeros"
      data-scene={numbers.scene}
      data-scene-title="Números"
      aria-labelledby="numeros-titulo"
      className="px-gutter relative bg-ink py-24 lg:py-36"
    >
      <SceneHeading scene={numbers.scene} slug={numbers.slug} />
      <h2 id="numeros-titulo" data-reveal className="display mt-4 text-5xl md:text-7xl">
        {numbers.title}
      </h2>

      <dl className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 lg:mt-20 lg:grid-cols-4 lg:gap-x-8">
        {numbers.items.map((item) => (
          <div key={item.label} data-reveal className="flex flex-col border-t border-steel pt-5">
            <dt className="order-2 mt-3 max-w-[18ch] text-sm font-medium text-bone/85 md:text-base">
              {item.label}
              {item.placeholder && (
                <span className="label mt-3 block w-fit border border-dashed border-bone/40 px-2 py-1 text-[0.625rem] text-ash">
                  Valor de exemplo
                </span>
              )}
            </dt>
            <dd className="display order-1 flex items-baseline text-[clamp(2.75rem,13vw,7rem)] leading-none lg:text-[min(6.6vw,6.5rem)]">
              {item.prefix && <span className="text-red">{item.prefix}</span>}
              <span className="number-value tabular" data-value={item.value}>
                {format.format(item.value)}
              </span>
              {item.suffix && <span className="text-[0.34em] tracking-[0.04em]">{item.suffix.replace(" ", " ")}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
