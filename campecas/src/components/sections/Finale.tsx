"use client";

import { useRef } from "react";
import { finale, isPlaceholder, site } from "@/content/site";
import { EASE, gsap, MQ, useGSAP } from "@/lib/gsap";
import { useReveal } from "@/lib/reveal";
import { hasWhatsApp, whatsappUrl } from "@/lib/whatsapp";
import { SceneHeading } from "@/components/ui/SceneHeading";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

const title = finale.titleLines.join(" ");
const hasAddress = !isPlaceholder(site.address);
const hasInstagram = !isPlaceholder(site.instagram);
const mapQuery = encodeURIComponent(`${site.fullName}, ${site.address}`);
const info = "text-lg font-medium text-bone md:text-xl";
const infoLink = `${info} underline decoration-red decoration-2 underline-offset-4 transition-opacity duration-300 hover:opacity-70`;

/** CENA 10 — a frase final, o botão e os dados de contato com o mapa. */
export function Finale() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);
      media.add(MQ.motion, () => {
        gsap.from(".finale-line", {
          yPercent: 106,
          duration: 1.5,
          ease: EASE.out,
          stagger: 0.14,
          scrollTrigger: { trigger: ".finale-title", start: "top 82%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="contato"
      data-scene={finale.scene}
      data-scene-title="Contato"
      aria-labelledby="contato-titulo"
      className="relative overflow-hidden bg-ink"
    >
      <div className="px-gutter flex flex-col items-center pt-28 pb-20 text-center lg:pt-44 lg:pb-28">
        <SceneHeading scene={finale.scene} slug={finale.slug} className="justify-center" />
        <h2
          id="contato-titulo"
          aria-label={title}
          className="finale-title display mt-8 text-[clamp(2.75rem,12.6vw,7rem)] text-balance lg:text-[min(8.4vw,10rem)]"
        >
          {finale.titleLines.map((line) => (
            <span key={line} aria-hidden="true" className="block overflow-hidden">
              <span className="finale-line block">{line}</span>
            </span>
          ))}
        </h2>
        <p data-reveal className="mt-8 max-w-[44ch] text-lg text-bone/90 md:text-xl">
          {finale.lead}
        </p>
        <div data-reveal className="mt-10">
          <WhatsAppButton>{finale.cta}</WhatsAppButton>
        </div>
      </div>

      <div className="px-gutter grid gap-x-8 gap-y-12 border-t border-steel py-16 lg:grid-cols-12 lg:py-24">
        <dl className="grid content-start gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-span-5">
          <div data-reveal>
            <dt className="label text-ash">Endereço</dt>
            <dd className="mt-3">
              <address className={`${info} not-italic`}>{site.address}</address>
              {hasAddress && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label mt-3 inline-block border-b border-red py-1 text-bone"
                >
                  Abrir no Google Maps
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              )}
            </dd>
          </div>
          <div data-reveal>
            <dt className="label text-ash">Horário</dt>
            <dd className={`${info} mt-3`}>{site.hours}</dd>
          </div>
          <div data-reveal>
            <dt className="label text-ash">Telefones</dt>
            <dd className="mt-3 flex flex-col items-start gap-2">
              {hasWhatsApp ? (
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={infoLink}>
                  {site.whatsapp.display}
                  <span className="label ml-2 inline-block text-ash">WhatsApp</span>
                </a>
              ) : (
                <span className={info}>[NÚMERO]</span>
              )}
              <a href={`tel:${site.phone.number}`} className={infoLink}>
                {site.phone.display}
                <span className="label ml-2 inline-block text-ash">Fixo</span>
              </a>
            </dd>
          </div>
          <div data-reveal>
            <dt className="label text-ash">Instagram</dt>
            <dd className="mt-3">
              {hasInstagram ? (
                <a
                  href={`https://www.instagram.com/${site.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={infoLink}
                >
                  {site.instagram}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              ) : (
                <span className={info}>{site.instagram}</span>
              )}
            </dd>
          </div>
        </dl>

        <div data-reveal className="lg:col-span-7">
          <div className="relative aspect-4/3 overflow-hidden border border-steel bg-graphite sm:aspect-21/9 lg:aspect-auto lg:h-full lg:min-h-80">
            {hasAddress ? (
              <iframe
                title={`Mapa: como chegar à ${site.name}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0 contrast-90 grayscale invert-[0.92]"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="display text-5xl text-bone/15 md:text-7xl" aria-hidden="true">
                  Mapa
                </span>
                <p className="label text-bone">Mapa do Google</p>
                <p className="max-w-[38ch] text-sm text-ash">
                  O mapa aparece aqui assim que o endereço real for preenchido em src/content/site.ts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
