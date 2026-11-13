"use client";

import { useRef, useState } from "react";
import { EASE, gsap, MQ, useGSAP } from "@/lib/gsap";
import { Logo } from "@/components/ui/Logo";
import { useCinema } from "./SmoothScroll";

/**
 * CENA 01 — tela preta, uma linha de luz que "dá a partida" (pisca e firma),
 * contador 000→100 e as duas metades da tela se abrem como barras de letterbox.
 * A linha de luz é a fresta entre as duas metades.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const { markReady } = useCinema();
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      if (window.matchMedia(MQ.reduced).matches) {
        markReady();
        setDone(true);
        return;
      }

      const progress = { value: 0 };
      const timeline = gsap.timeline({
        defaults: { ease: EASE.inOut },
        onComplete: () => setDone(true),
      });

      timeline
        // motor de arranque: a luz tenta pegar, falha, pega
        .set(".pre-edge", { scaleX: 0.06, opacity: 0 })
        .to(".pre-edge", {
          keyframes: { opacity: [0, 1, 0.15, 0.9, 0.1, 1, 0.35, 1] },
          duration: 0.8,
          ease: "none",
        })
        .to(".pre-ui", { opacity: 1, duration: 0.5, ease: EASE.soft }, 0.2)
        // pegou: a linha corre a tela e o contador sobe junto
        .to(".pre-edge", { scaleX: 1, duration: 1.5 }, 0.75)
        .to(
          progress,
          {
            value: 100,
            duration: 1.5,
            onUpdate: () => {
              if (counter.current) {
                counter.current.textContent = String(Math.round(progress.value)).padStart(3, "0");
              }
            },
          },
          0.75,
        )
        .to(".pre-ui", { opacity: 0, duration: 0.3, ease: EASE.soft }, "+=0.12")
        // as barras se abrem e revelam o hero
        .add(() => markReady())
        .to(".pre-top", { yPercent: -100, duration: 1.25 }, "<")
        .to(".pre-bottom", { yPercent: 100, duration: 1.25 }, "<")
        .to(".pre-edge", { opacity: 0, duration: 0.7, ease: EASE.soft }, "<0.35");
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <div ref={root} className="preloader fixed inset-0 z-100" aria-hidden="true">
      <div className="pre-top absolute inset-x-0 top-0 h-[calc(50%+1px)] bg-black">
        <div className="pre-ui px-gutter absolute inset-x-0 bottom-6 flex items-end justify-between opacity-0">
          <Logo className="h-5 w-auto text-bone md:h-6" title="" />
          <span className="label text-ash">Rolo 01</span>
        </div>
        <span className="pre-edge absolute inset-x-0 bottom-0 h-px origin-center bg-bone shadow-[0_0_18px_2px_rgb(237_233_227/0.55)]" />
      </div>
      <div className="pre-bottom absolute inset-x-0 bottom-0 h-[calc(50%+1px)] bg-black">
        <span className="pre-edge absolute inset-x-0 top-0 h-px origin-center bg-bone shadow-[0_0_18px_2px_rgb(237_233_227/0.55)]" />
        <div className="pre-ui px-gutter absolute inset-x-0 top-6 flex items-start justify-between opacity-0">
          <span className="label text-ash">Dando a partida</span>
          <span ref={counter} className="display tabular text-5xl text-bone md:text-7xl">
            000
          </span>
        </div>
      </div>
    </div>
  );
}
