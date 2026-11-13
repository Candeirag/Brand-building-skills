"use client";

import type { RefObject } from "react";
import { EASE, gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * Revela, ao entrar na tela, todo elemento com `data-reveal` dentro de `root`.
 * Só transform + opacity. Com movimento reduzido, nada é escondido.
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const media = gsap.matchMedia(root);
      media.add(MQ.motion, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 36,
            opacity: 0,
            duration: 1.3,
            ease: EASE.out,
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });
      });
    },
    { scope: root },
  );
}
