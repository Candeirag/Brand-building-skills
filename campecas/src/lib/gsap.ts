"use client";

/**
 * Ponto único de entrada do GSAP. Os plugins são registrados uma vez,
 * e só no navegador (este módulo só é importado por componentes client).
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  // No celular, a barra de endereço que some/aparece não deve recalcular os pins.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Easings "de cinema": revelações longas, nada pulando. */
export const EASE = {
  out: "power4.out",
  inOut: "expo.inOut",
  soft: "power2.out",
} as const;

/** Media queries usadas com gsap.matchMedia(). */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  /** Palco fixado (capítulos, processo): tela larga, alta o bastante e com movimento. Igual à variante `stage:` do CSS. */
  stage: "(min-width: 1024px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)",
  /** Com movimento, mas sem palco: cenas empilhadas com animações leves. */
  stackedMotion:
    "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference), (max-height: 679.98px) and (prefers-reduced-motion: no-preference)",
  /** Qualquer situação sem palco (inclui movimento reduzido). */
  stacked: "(max-width: 1023.98px), (max-height: 679.98px), (prefers-reduced-motion: reduce)",
  /** Antes → depois fixado: só precisa de altura mínima e movimento. */
  pinned: "(min-height: 560px) and (prefers-reduced-motion: no-preference)",
  finePointer: "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
