"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gallery } from "@/content/site";
import { useMediaQuery } from "@/lib/hooks";
import { useReveal } from "@/lib/reveal";
import { Lightbox } from "@/components/ui/Lightbox";
import { SceneHeading } from "@/components/ui/SceneHeading";

/** Grid assimétrico: largura e deslocamento de cada peça (12 colunas a partir do tablet). */
const layout = [
  "md:col-span-7",
  "md:col-span-5 md:mt-28",
  "md:col-span-5 md:col-start-2",
  "md:col-span-6 md:mt-24",
  "md:col-span-6",
  "md:col-span-5 md:col-start-8 md:mt-20",
];

/**
 * CENA 07 — galeria. Cada peça mostra o "depois"; no hover (ou foco) um zoom lento
 * revela o "antes". Clique ou toque abre o lightbox.
 */
export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const canHover = useMediaQuery("(hover: hover)");
  useReveal(root);

  return (
    <section
      ref={root}
      id="galeria"
      data-scene={gallery.scene}
      data-scene-title="Galeria"
      aria-labelledby="galeria-titulo"
      className="px-gutter relative bg-graphite py-24 lg:py-36"
    >
      <SceneHeading scene={gallery.scene} slug={gallery.slug} />
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 id="galeria-titulo" data-reveal className="display text-[clamp(3.25rem,14vw,9rem)]">
          {gallery.title}
        </h2>
        <p data-reveal className="max-w-[30ch] text-base text-bone/90 md:pb-3 md:text-right md:text-lg">
          {canHover ? gallery.leadHover : gallery.leadTouch}
        </p>
      </div>

      <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-12 md:gap-x-8 md:gap-y-16 lg:mt-20">
        {gallery.items.map((item, index) => (
          <li key={item.id} data-reveal className={`${layout[index % layout.length]} ${index % 2 === 1 ? "max-md:ml-auto max-md:w-[86%]" : ""}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              data-cursor="media"
              aria-label={`Ampliar trabalho ${item.id}: ${item.caption}, antes e depois`}
              className="group block w-full text-left"
            >
              <span className="relative block aspect-4/3 overflow-hidden bg-ink">
                <Image
                  src={item.before}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="scale-100 object-cover transition-transform duration-[2600ms] ease-cine group-hover:scale-[1.07] group-focus-visible:scale-[1.07] motion-reduce:transition-none"
                />
                <Image
                  src={item.after}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="scale-100 object-cover transition-[transform,opacity] duration-[2600ms,900ms] ease-cine group-hover:scale-[1.07] group-hover:opacity-0 group-focus-visible:scale-[1.07] group-focus-visible:opacity-0 motion-reduce:transition-none"
                />
              </span>
              <span className="label mt-3 flex items-center justify-between gap-4 text-bone">
                <span>
                  <span className="text-ash">{item.id}</span>
                  <span className="mx-2 text-red" aria-hidden="true">
                    —
                  </span>
                  {item.caption}
                </span>
                <span className="grid shrink-0 text-right text-ash" aria-hidden="true">
                  <span className="col-start-1 row-start-1 transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0">
                    Depois
                  </span>
                  <span className="col-start-1 row-start-1 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                    Antes
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Lightbox items={gallery.items} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </section>
  );
}
