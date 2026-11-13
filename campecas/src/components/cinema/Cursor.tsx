"use client";

import { useRef } from "react";
import { EASE, gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * Cursor customizado sutil (só desktop com mouse): um anel que segue o ponteiro
 * e cresce sobre links, botões e imagens. O cursor nativo continua visível.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add(MQ.finePointer, () => {
      const follower = root.current;
      if (!follower) return;

      gsap.set(follower, { xPercent: -50, yPercent: -50, opacity: 0 });
      const moveX = gsap.quickTo(follower, "x", { duration: 0.4, ease: "power3" });
      const moveY = gsap.quickTo(follower, "y", { duration: 0.4, ease: "power3" });
      let visible = false;

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        moveX(event.clientX);
        moveY(event.clientY);
        if (!visible) {
          visible = true;
          gsap.to(follower, { opacity: 1, duration: 0.4 });
        }
      };

      const onOver = (event: PointerEvent) => {
        const target = event.target instanceof Element ? event.target : null;
        const media = target?.closest("[data-cursor='media']");
        const interactive = target?.closest("a, button, [role='button']");
        const scale = media ? 4.2 : interactive ? 2.4 : 1;
        gsap.to(ring.current, { scale, duration: 0.6, ease: EASE.out, overwrite: "auto" });
        gsap.to(fill.current, {
          scale,
          opacity: media ? 0.28 : interactive ? 0.2 : 0,
          duration: 0.6,
          ease: EASE.out,
          overwrite: "auto",
        });
      };

      const onLeave = () => {
        visible = false;
        gsap.to(follower, { opacity: 0, duration: 0.3 });
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);

      return () => {
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      };
    });
  });

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-70 hidden size-4 opacity-0 [@media(hover:hover)_and_(pointer:fine)]:block"
    >
      <span ref={fill} className="absolute inset-0 rounded-full bg-red opacity-0" />
      <span ref={ring} className="absolute inset-0 rounded-full border border-bone/70" />
    </div>
  );
}
