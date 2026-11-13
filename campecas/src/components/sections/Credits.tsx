"use client";

import { useRef } from "react";
import { credits, site } from "@/content/site";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { Logo } from "@/components/ui/Logo";

/** Rodapé em forma de créditos finais, que "rolam" mais rápido que a página. */
export function Credits() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);
      media.add(MQ.motion, () => {
        gsap.fromTo(
          ".credits-roll",
          { y: () => window.innerHeight * 0.38 },
          {
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top bottom",
              end: "bottom bottom",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative overflow-hidden bg-black">
      <div className="credits-roll px-gutter flex flex-col items-center pt-24 pb-[calc(var(--bar)+6rem)] text-center lg:pt-32">
        <h2 className="label text-ash">{credits.heading}</h2>

        <dl className="mt-12 grid w-full max-w-2xl grid-cols-2 gap-x-5 gap-y-4 md:gap-x-8">
          {credits.rows.map((row) => (
            <div key={row.role} className="contents">
              <dt className="label self-center text-right text-ash">{row.role}</dt>
              <dd className="text-left text-base font-medium text-bone md:text-lg">{row.name}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-16 max-w-[34ch] text-sm text-ash">{credits.disclaimer}</p>

        <Logo className="mt-16 h-10 w-auto text-bone md:h-12" />
        <p className="display mt-12 text-6xl md:text-8xl">{credits.end}</p>

        <p className="label mt-14 text-ash">
          © {site.fullName} · {site.region}
        </p>
      </div>
    </footer>
  );
}
