"use client";

import { useRef } from "react";
import { testimonials } from "@/content/site";
import { useReveal } from "@/lib/reveal";
import { SceneHeading } from "@/components/ui/SceneHeading";

/**
 * CENA 09 — depoimentos. Só a estrutura: os textos são placeholders marcados
 * em site.ts e devem ser trocados por depoimentos reais.
 */
export function Testimonials() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section
      ref={root}
      id="depoimentos"
      data-scene={testimonials.scene}
      data-scene-title="Depoimentos"
      aria-labelledby="depoimentos-titulo"
      className="px-gutter relative bg-graphite py-24 lg:py-36"
    >
      <SceneHeading scene={testimonials.scene} slug={testimonials.slug} />
      <h2 id="depoimentos-titulo" data-reveal className="display mt-4 max-w-[14ch] text-[clamp(3rem,12vw,7.5rem)] text-balance">
        {testimonials.title}
      </h2>

      <ul className="mt-14 grid gap-x-8 gap-y-10 lg:mt-20 lg:grid-cols-3">
        {testimonials.items.map((item, index) => (
          <li key={index} data-reveal className="border-t border-steel pt-6">
            <figure className="flex h-full flex-col">
              <span className="display text-7xl leading-[0.7] text-red" aria-hidden="true">
                “
              </span>
              <blockquote className="mt-2 text-2xl leading-snug font-medium text-bone md:text-3xl">
                <p>{item.quote}</p>
              </blockquote>
              <figcaption className="label mt-8 flex flex-col gap-1.5 text-ash lg:mt-auto lg:pt-10">
                <span className="text-bone">{item.author}</span>
                <span>{item.detail}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
