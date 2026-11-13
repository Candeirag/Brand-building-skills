"use client";

import { useRef } from "react";
import Image from "next/image";
import { family } from "@/content/site";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { useReveal } from "@/lib/reveal";
import { SceneHeading } from "@/components/ui/SceneHeading";

/**
 * CENA 08 — quem faz. A foto começa em preto e branco e ganha cor com a rolagem:
 * duas cópias, a de cima com grayscale estático e a opacidade guiada pelo scroll.
 */
export function Family() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);
      media.add(MQ.motion, () => {
        gsap.to(".family-gray", {
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ".family-photo", start: "top 70%", end: "center 42%", scrub: true },
        });
        gsap.fromTo(
          ".family-parallax",
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: { trigger: ".family-photo", start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="quem-faz"
      data-scene={family.scene}
      data-scene-title="Quem faz"
      aria-labelledby="quem-faz-titulo"
      className="px-gutter relative bg-ink py-24 lg:py-40"
    >
      <div className="grid gap-x-8 gap-y-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <SceneHeading scene={family.scene} slug={family.slug} />
          <h2
            id="quem-faz-titulo"
            data-reveal
            className="display mt-4 text-[clamp(3.25rem,14vw,8rem)] text-balance lg:text-[min(7.6vw,8.5rem)]"
          >
            {family.title}
          </h2>
          <div className="mt-8 flex max-w-[48ch] flex-col gap-5 text-lg text-bone/90 md:text-xl">
            {family.paragraphs.map((paragraph) => (
              <p key={paragraph} data-reveal>
                {paragraph}
              </p>
            ))}
          </div>
          <p data-reveal className="mt-8 max-w-[48ch] border border-dashed border-bone/40 p-4 text-sm text-ash">
            {family.story}
          </p>
        </div>

        <figure className="lg:col-span-5 lg:col-start-8">
          <div className="family-photo relative aspect-4/5 overflow-hidden bg-graphite" data-cursor="media">
            <div className="family-parallax absolute inset-x-0 -inset-y-[6%]">
              <Image src={family.image} alt={family.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              <div className="family-gray absolute inset-0 motion-reduce:hidden" aria-hidden="true">
                <Image src={family.image} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover grayscale" />
              </div>
            </div>
          </div>
          <figcaption className="label mt-3 flex items-center justify-between gap-4 text-ash">
            <span className="text-bone">{family.caption}</span>
            <span>Oficina de família · DF</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
