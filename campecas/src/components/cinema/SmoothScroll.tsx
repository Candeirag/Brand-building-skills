"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, MQ, ScrollTrigger } from "@/lib/gsap";

type CinemaContextValue = {
  /** true depois que o preloader termina (ou é pulado). O hero espera por isso. */
  ready: boolean;
  markReady: () => void;
  /** Trava a rolagem (lightbox aberto). */
  lockScroll: (locked: boolean) => void;
  /** Rola até um ponto, suave quando o Lenis está ativo. */
  scrollTo: (target: number | string | HTMLElement) => void;
};

const CinemaContext = createContext<CinemaContextValue | null>(null);

export function useCinema() {
  const value = useContext(CinemaContext);
  if (!value) throw new Error("useCinema precisa estar dentro de <SmoothScroll>");
  return value;
}

/**
 * Rolagem suave (Lenis) sincronizada com o ticker do GSAP e o ScrollTrigger.
 * Com prefers-reduced-motion o Lenis nem é criado: a rolagem é a nativa.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia(MQ.reduced).matches) return;

    const lenis = new Lenis({ anchors: true, autoRaf: false, lerp: 0.1 });
    lenisRef.current = lenis;
    if (!readyRef.current) lenis.stop(); // parado enquanto o preloader roda

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const markReady = useCallback(() => {
    readyRef.current = true;
    lenisRef.current?.start();
    setReady(true);
  }, []);

  const lockScroll = useCallback((locked: boolean) => {
    document.documentElement.style.overflow = locked ? "hidden" : "";
    if (!readyRef.current) return;
    if (locked) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, []);

  const scrollTo = useCallback((target: number | string | HTMLElement) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target);
      return;
    }
    if (typeof target === "number") {
      window.scrollTo({ top: target });
      return;
    }
    const element = typeof target === "string" ? document.querySelector(target) : target;
    element?.scrollIntoView();
  }, []);

  const value = useMemo(
    () => ({ ready, markReady, lockScroll, scrollTo }),
    [ready, markReady, lockScroll, scrollTo],
  );

  return <CinemaContext.Provider value={value}>{children}</CinemaContext.Provider>;
}
