"use client";

import { useEffect, useRef } from "react";
import { hero } from "@/content/site";
import { EASE, gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";
import { useCinema } from "@/components/cinema/SmoothScroll";
import { SceneHeading } from "@/components/ui/SceneHeading";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

const title = hero.titleLines.join(" ");
const lastLine = hero.titleLines[hero.titleLines.length - 1];

/** CENA 02 — vídeo em loop escurecido, título revelado letra a letra. */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const intro = useRef<gsap.core.Timeline | null>(null);
  const { ready } = useCinema();

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MQ.motion, () => {
        const split = SplitText.create(".hero-line", { type: "chars", aria: "none" });

        // Entrada: fica pausada até o preloader abrir as barras.
        intro.current = gsap
          .timeline({ paused: true, defaults: { ease: EASE.out } })
          .from(".hero-video", { scale: 1.14, duration: 2.6, ease: EASE.soft }, 0)
          .from(split.chars, { yPercent: 118, duration: 1.25, stagger: 0.032 }, 0.3)
          .from(".hero-mirror", { opacity: 0, duration: 1.8, ease: EASE.soft }, 1.2)
          .from(".hero-fade", { opacity: 0, y: 22, duration: 1.3, stagger: 0.12 }, 1.05);

        // Saída: o quadro desce devagar enquanto a próxima cena chega.
        gsap.to(".hero-media", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });

        return () => {
          intro.current = null;
          split.revert();
        };
      });
    },
    { scope: root },
  );

  useEffect(() => {
    if (!ready) return;
    intro.current?.play();
    // O vídeo só toca com movimento liberado; senão fica o poster.
    if (window.matchMedia(MQ.motion).matches) {
      video.current?.play().catch(() => {});
    }
  }, [ready]);

  return (
    <section
      ref={root}
      id="topo"
      data-scene={hero.scene}
      data-scene-title="Abertura"
      className="relative flex h-svh min-h-[38rem] flex-col overflow-hidden bg-ink"
    >
      <div className="hero-media absolute inset-0" aria-hidden="true">
        <video
          ref={video}
          className="hero-video size-full object-cover opacity-80"
          muted
          loop
          playsInline
          preload="metadata"
          poster={hero.poster}
          tabIndex={-1}
        >
          <source src={hero.video} type="video/mp4" />
        </video>
      </div>
      <div
        className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_4%,rgb(11_11_12/0.72)_34%,rgb(11_11_12/0.18)_62%,rgb(11_11_12/0.6)_100%)]"
        aria-hidden="true"
      />
      <div className="flare" aria-hidden="true" />

      <div className="px-gutter relative flex flex-1 flex-col pt-[calc(var(--bar)+1.25rem)] pb-[calc(var(--bar)+5.5rem)] sm:pb-[calc(var(--bar)+1.5rem)] md:pt-[calc(var(--bar)+2rem)] md:pb-[calc(var(--bar)+2rem)]">
        <SceneHeading scene={hero.scene} slug={hero.slug} className="hero-fade" />

        {/*
          --hero-size: a linha mais longa ("AO ESPELHADO.") mede 5,6em em Anton;
          dividir a largura útil por 5,75 garante que ela nunca quebre.
        */}
        <div className="mt-auto grid gap-x-10 gap-y-6 [--hero-size:min(calc((100vw-2*var(--gutter))/5.75),19svh)] xl:grid-cols-[1fr_21rem] xl:items-end xl:[--hero-size:min(calc((100vw-2*var(--gutter)-23.5rem)/5.75),27svh)]">
          <div className="display text-[length:var(--hero-size)] whitespace-nowrap text-bone">
            <h1 aria-label={title} className="[font:inherit]">
              {hero.titleLines.map((line) => (
                <span key={line} aria-hidden="true" className="hero-line block overflow-hidden">
                  {line}
                </span>
              ))}
            </h1>
            {/* "Espelhado": o reflexo da última linha, como em verniz molhado. */}
            <span
              aria-hidden="true"
              className="hero-mirror -mt-[0.1em] block h-[0.4em] overflow-hidden opacity-20 select-none [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
            >
              <span className="block -scale-y-100">{lastLine}</span>
            </span>
          </div>

          <div className="flex flex-col items-start gap-6 xl:pb-24">
            <p className="hero-fade max-w-[34ch] text-base text-bone/90 md:text-lg">{hero.subtitle}</p>
            <div className="hero-fade">
              <WhatsAppButton>{hero.cta}</WhatsAppButton>
            </div>
          </div>
        </div>
      </div>

      <div
        className="hero-fade absolute top-[42%] right-(--gutter) flex -translate-y-1/2 flex-col items-center gap-3 [@media(max-height:500px)]:hidden"
        aria-hidden="true"
      >
        <span className="label text-ash [writing-mode:vertical-rl]">Role</span>
        <span className="relative block h-14 w-px overflow-hidden bg-bone/25">
          <span className="scroll-cue-dot absolute inset-x-0 top-0 block h-5 bg-bone" />
        </span>
      </div>
    </section>
  );
}
