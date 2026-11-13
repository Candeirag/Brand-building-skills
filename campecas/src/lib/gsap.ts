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
  desktop: "(min-width: 1024px)",
  desktopMotion: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  compactMotion: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
  finePointer: "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
