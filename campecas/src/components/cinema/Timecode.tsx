"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { announceScene, SCENE_EVENT, type SceneDetail } from "@/lib/scene";
import { LetterboxBar } from "./Letterbox";

const FPS = 24;
/** Duração fictícia do "filme": a página inteira vale 2 min 30 s. */
const RUNTIME_SECONDS = 150;

const pad = (value: number) => String(value).padStart(2, "0");

function formatTimecode(progress: number) {
  const frames = Math.round(progress * RUNTIME_SECONDS * FPS);
  const seconds = Math.floor(frames / FPS);
  return `00:${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}:${pad(frames % FPS)}`;
}

/**
 * Barra inferior: legenda da cena atual + timecode guiado pela rolagem.
 * Decorativo (aria-hidden); escreve direto no DOM, sem re-render do React.
 * Precisa vir DEPOIS das seções no DOM, para os ScrollTriggers nascerem na ordem da página.
 */
export function Timecode() {
  const root = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLSpanElement>(null);
  const code = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onScene = (event: Event) => {
      const { scene, title } = (event as CustomEvent<SceneDetail>).detail;
      if (caption.current) caption.current.textContent = `Cena ${scene} — ${title}`;
    };
    window.addEventListener(SCENE_EVENT, onScene);
    return () => window.removeEventListener(SCENE_EVENT, onScene);
  }, []);

  useGSAP(() => {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (code.current) code.current.textContent = formatTimecode(self.progress);
      },
    });

    gsap.utils.toArray<HTMLElement>("[data-scene]").forEach((section) => {
      const detail = { scene: section.dataset.scene ?? "", title: section.dataset.sceneTitle ?? "" };
      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive) announceScene(detail);
        },
      });
    });
  });

  return (
    <div ref={root}>
      <LetterboxBar position="bottom" hidden>
        <span className="label flex min-w-0 items-center gap-2.5 text-ash">
          <span className="size-1.5 shrink-0 bg-red" />
          <span ref={caption} className="truncate">
            Cena 02 — Abertura
          </span>
        </span>
        <span ref={code} className="label shrink-0 text-ash">
          00:00:00:00
        </span>
      </LetterboxBar>
    </div>
  );
}
