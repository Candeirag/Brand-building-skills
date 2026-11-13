"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/** Assina uma media query. No servidor (e na hidratação) vale `false`. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * true quando o elemento está a até ~1,5 tela de distância.
 * Usado para carregar imagens que ficam escondidas por máscara/corte
 * (onde o lazy-loading nativo não dispararia a tempo).
 */
export function useNear(ref: RefObject<Element | null>) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, near]);

  return near;
}
