"use client";

import { useRef } from "react";
import { Camera, ImagePlus, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import type { PendingUpload, PhotoView } from "./types";

export function CaptureButton({
  onFiles,
  label = "Fotografar",
  variant = "tile",
  allowGallery = false,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  label?: string;
  variant?: "tile" | "inline";
  allowGallery?: boolean;
  disabled?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/") || f.type === "");
    e.target.value = "";
    if (files.length) onFiles(files);
  };

  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handle} tabIndex={-1} />
      <input ref={galleryRef} type="file" accept="image/*" multiple className="sr-only" onChange={handle} tabIndex={-1} />
    </>
  );

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap gap-2">
        {inputs}
        <button
          type="button"
          disabled={disabled}
          onClick={() => cameraRef.current?.click()}
          className="inline-flex h-11 items-center gap-2 rounded-control border border-ink bg-surface px-3.5 text-sm font-medium text-ink disabled:opacity-50 sm:h-9"
        >
          <Camera size={18} /> {label}
        </button>
        {allowGallery && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => galleryRef.current?.click()}
            className="inline-flex h-11 items-center gap-2 rounded-control border border-control bg-surface px-3.5 text-sm font-medium text-ink disabled:opacity-50 sm:h-9"
          >
            <ImagePlus size={18} /> Galeria
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3]">
      {inputs}
      <button
        type="button"
        disabled={disabled}
        onClick={() => cameraRef.current?.click()}
        className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-dash bg-surface text-muted transition hover:border-ink hover:text-ink disabled:opacity-50"
      >
        <Camera size={22} strokeWidth={1.75} />
        <span className="text-sm font-medium">{label}</span>
      </button>
      {allowGallery && (
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="absolute right-1.5 bottom-1.5 flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-muted"
          aria-label="Escolher da galeria"
        >
          <ImagePlus size={16} />
        </button>
      )}
    </div>
  );
}

export function PhotoTile({
  photo,
  onOpen,
  onDelete,
  readOnly,
}: {
  photo: PhotoView;
  onOpen?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-card bg-raised">
      {photo.url ? (
        <button type="button" onClick={onOpen} className="block h-full w-full" aria-label="Ampliar foto">
          {/* eslint-disable-next-line @next/next/no-img-element -- URLs assinadas/blob não passam pelo otimizador */}
          <img src={photo.url} alt={photo.caption ?? "Foto da inspeção"} className="h-full w-full object-cover" loading="lazy" />
        </button>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted">Indisponível</div>
      )}
      {!readOnly && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-1.5 right-1.5 flex h-9 w-9 items-center justify-center rounded-control bg-black/70 text-white hover:bg-accent-ink"
          aria-label="Excluir foto"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export function PendingTile({ upload, onRetry, onDiscard }: { upload: PendingUpload; onRetry: () => void; onDiscard: () => void }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={upload.previewUrl} alt="" className="h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center text-white">
        {upload.error ? (
          <>
            <span className="text-xs font-medium">{upload.error}</span>
            <div className="flex gap-2">
              <button type="button" onClick={onRetry} className="h-8 rounded-control bg-white px-2.5 text-xs font-medium text-ink">
                <RotateCcw size={14} className="mr-1 inline" />
                Repetir
              </button>
              <button type="button" onClick={onDiscard} className="h-8 rounded-control border border-white/40 px-2.5 text-xs font-medium">
                Descartar
              </button>
            </div>
          </>
        ) : (
          <>
            <LoaderCircle className="animate-spin" size={26} />
            <span className="text-xs font-medium">Enviando…</span>
          </>
        )}
      </div>
    </div>
  );
}
