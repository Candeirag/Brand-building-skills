"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxPhoto = { url: string | null; caption?: string | null; label?: string };

export function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const open = index !== null && photos[index] !== undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(((index ?? 0) + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndex(((index ?? 0) - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, index, photos.length, onClose, onIndex]);

  if (!open) return null;
  const photo = photos[index]!;

  return (
    <div role="dialog" aria-modal="true" aria-label="Visualizar foto" className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between p-3 text-white">
        <div className="min-w-0 pl-2">
          <p className="truncate text-sm font-semibold">{photo.label}</p>
          {photo.caption && <p className="truncate text-xs text-white/60">{photo.caption}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">
            {index + 1}/{photos.length}
          </span>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2.5" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-6">
        {photo.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={photo.caption ?? photo.label ?? ""} className="max-h-full max-w-full object-contain" />
        )}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndex((index - 1 + photos.length) % photos.length)}
              className="absolute left-2 rounded-full bg-white/10 p-3 text-white"
              aria-label="Anterior"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % photos.length)}
              className="absolute right-2 rounded-full bg-white/10 p-3 text-white"
              aria-label="Próxima"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
