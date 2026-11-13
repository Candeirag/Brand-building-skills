"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { EASE, gsap, MQ, useGSAP } from "@/lib/gsap";
import { useCinema } from "@/components/cinema/SmoothScroll";
import { ArrowIcon, CloseIcon } from "./icons";

export type LightboxItem = { id: string; caption: string; before: string; after: string };

type LightboxProps = {
  items: LightboxItem[];
  /** Índice aberto, ou null quando fechado. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

const control =
  "label grid min-h-11 min-w-11 place-items-center border border-bone/25 px-3 text-bone transition-opacity duration-300 hover:opacity-70";

/**
 * Lightbox "sala de projeção": <dialog> nativo (foco preso, Esc fecha),
 * setas do teclado para navegar e botões Antes/Depois.
 */
export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<"before" | "after">("after");
  const { lockScroll } = useCinema();
  const open = index !== null;
  const item = open ? items[index] : null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      lockScroll(true);
    } else if (!open && element.open) {
      element.close();
    }
  }, [open, lockScroll]);

  useGSAP(
    () => {
      if (!open || !window.matchMedia(MQ.motion).matches) return;
      gsap.fromTo(
        ".lightbox-frame",
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: EASE.out },
      );
    },
    { scope: dialog, dependencies: [index] },
  );

  const go = (step: number) => {
    if (index === null) return;
    setView("after");
    onNavigate((index + step + items.length) % items.length);
  };

  return (
    <dialog
      ref={dialog}
      aria-label="Galeria ampliada"
      className="lightbox fixed inset-0 m-0 h-dvh w-screen border-0 bg-black p-0 text-bone"
      onClose={() => {
        lockScroll(false);
        setView("after");
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
    >
      {item && (
        <div className="flex h-full flex-col">
          <div className="px-gutter flex h-(--bar) shrink-0 items-center justify-between gap-4 border-b border-bone/8">
            <p className="label truncate" aria-live="polite">
              <span className="text-ash">
                Trabalho {item.id} / {String(items.length).padStart(2, "0")}
              </span>
              <span className="mx-2 text-red" aria-hidden="true">
                —
              </span>
              {item.caption}
            </p>
            <button type="button" onClick={() => dialog.current?.close()} className={control} aria-label="Fechar galeria">
              <CloseIcon className="size-4" />
            </button>
          </div>

          <div className="lightbox-frame px-gutter relative min-h-0 flex-1 py-4 md:py-6">
            <div className="relative size-full">
              <Image src={item.before} alt={`${item.caption}: antes do serviço.`} fill sizes="100vw" className="object-contain" />
              <Image
                src={item.after}
                alt={`${item.caption}: depois do serviço.`}
                fill
                sizes="100vw"
                className={`object-contain transition-opacity duration-700 ease-cine motion-reduce:transition-none ${
                  view === "after" ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>

          <div className="px-gutter flex shrink-0 items-center justify-between gap-4 border-t border-bone/8 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div role="group" aria-label="Ver antes ou depois" className="flex">
              {(["before", "after"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === option}
                  onClick={() => setView(option)}
                  className={`${control} px-4 ${view === option ? "border-bone bg-bone text-ink" : ""} ${option === "after" ? "-ml-px" : ""}`}
                >
                  {option === "before" ? "Antes" : "Depois"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => go(-1)} className={control} aria-label="Trabalho anterior">
                <ArrowIcon className="size-4 -scale-x-100" />
              </button>
              <button type="button" onClick={() => go(1)} className={control} aria-label="Próximo trabalho">
                <ArrowIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
