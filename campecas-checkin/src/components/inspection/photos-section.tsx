"use client";

import { PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/photos";
import { plural } from "@/lib/plural";
import { SectionCard } from "./fields";
import { CaptureButton, PendingTile, PhotoTile } from "./photo-widgets";
import type { PendingUpload, PhotoView } from "./types";

export function PhotosSection({
  photos,
  pending,
  onCapture,
  onDeletePhoto,
  onOpenPhoto,
  onRetry,
  onDiscard,
}: {
  photos: PhotoView[];
  pending: PendingUpload[];
  onCapture: (files: File[], category: PhotoCategory) => void;
  onDeletePhoto: (photo: PhotoView) => void;
  onOpenPhoto: (photo: PhotoView) => void;
  onRetry: (tempId: string) => void;
  onDiscard: (tempId: string) => void;
}) {
  const required = PHOTO_CATEGORIES.filter((c) => c.required);
  const done = required.filter((c) => photos.some((p) => p.category === c.value)).length;

  return (
    <SectionCard
      id="fotos"
      title="Fotografias"
      subtitle={`Frente e painel são obrigatórias, e uma foto de cada avaria · ${plural(photos.length, "foto", "fotos")} no total`}
      complete={done === required.length}
    >
      <div className="space-y-5">
        {PHOTO_CATEGORIES.map((cat) => {
          const catPhotos = photos.filter((p) => p.category === cat.value);
          const catPending = pending.filter((p) => p.category === cat.value);
          const multi = cat.value === "damage" || cat.value === "extra";
          return (
            <div key={cat.value}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium">
                  {cat.label}
                  {cat.required && catPhotos.length === 0 && (
                    <span className="ml-1.5 text-xs font-medium text-accent-ink">obrigatória</span>
                  )}
                  {!cat.required && cat.recommended && catPhotos.length === 0 && (
                    <span className="ml-1.5 text-xs font-normal text-muted">recomendada</span>
                  )}
                </h3>
                <span className="hidden text-xs text-muted sm:inline">{cat.hint}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {catPhotos.map((p) => (
                  <div key={p.id} className="relative">
                    <PhotoTile photo={p} onOpen={() => onOpenPhoto(p)} onDelete={() => onDeletePhoto(p)} />
                    {p.item_key && cat.value === "damage" && (
                      <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-chip bg-accent px-1.5 py-0.5 text-[11px] font-medium text-white">
                        Checklist
                      </span>
                    )}
                  </div>
                ))}
                {catPending.map((u) => (
                  <PendingTile key={u.tempId} upload={u} onRetry={() => onRetry(u.tempId)} onDiscard={() => onDiscard(u.tempId)} />
                ))}
                {(multi || catPhotos.length + catPending.length === 0) && (
                  <CaptureButton
                    label={catPhotos.length ? "Adicionar" : "Fotografar"}
                    allowGallery={multi}
                    onFiles={(files) => onCapture(files, cat.value)}
                  />
                )}
                {!multi && catPhotos.length + catPending.length > 0 && (
                  <CaptureButton label="Outra foto" onFiles={(files) => onCapture(files, cat.value)} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-xs text-muted">
        As fotos recebem automaticamente placa, data e hora, e ficam armazenadas com segurança na nuvem, vinculadas a esta
        inspeção.
      </p>
    </SectionCard>
  );
}
