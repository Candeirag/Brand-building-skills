"use client";

import { useState } from "react";
import { Lightbox } from "./lightbox";

export type GalleryGroup = {
  label: string;
  photos: { id: string; url: string | null; caption: string | null; tag?: string }[];
};

/** Galeria compacta: todas as fotos em uma grade, legendadas pela categoria. */
export function PhotoGallery({ groups }: { groups: GalleryGroup[] }) {
  const flat = groups.flatMap((g) =>
    g.photos.map((p) => ({ ...p, group: g.label, label: p.tag ? `${g.label} · ${p.tag}` : g.label })),
  );
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {flat.map((p, i) => (
          <figure key={p.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-card bg-raised"
              aria-label={`Ampliar foto: ${p.label}`}
            >
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={p.caption ?? p.label} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted">Indisponível</span>
              )}
              {p.tag && (
                <span className="absolute bottom-1.5 left-1.5 max-w-[90%] truncate rounded-chip bg-accent px-1.5 py-0.5 text-[11px] font-medium text-white">
                  {p.tag}
                </span>
              )}
            </button>
            <figcaption className="mt-1.5 truncate text-xs text-muted">{p.group}</figcaption>
          </figure>
        ))}
      </div>
      <Lightbox photos={flat} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />
    </>
  );
}
