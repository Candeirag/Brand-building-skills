"use client";

import { memo, useState } from "react";
import { AlertTriangle, Ban, Check, CheckCheck, EyeOff, MessageSquarePlus } from "lucide-react";
import {
  CHECKLIST_STATUS,
  CHECKLIST_STATUS_ORDER,
  FUEL_LEVELS,
  checklistProgress,
  groupItems,
  type ChecklistItemState,
  type ChecklistStatus,
  type FuelLevel,
} from "@/lib/checklist";
import { DamageMap } from "./damage-map";
import { SectionCard } from "./fields";
import { CaptureButton, PendingTile, PhotoTile } from "./photo-widgets";
import type { ItemsState, PendingUpload, PhotoView } from "./types";

/* Estado selecionado = par claro do mesmo matiz (nunca um bloco saturado com texto branco). */
const STATUS_STYLE: Record<ChecklistStatus, { icon: typeof Check; active: string }> = {
  ok: { icon: Check, active: "border-positive bg-positive-bg text-positive-ink font-medium" },
  damaged: { icon: AlertTriangle, active: "border-accent bg-tint text-accent-ink font-medium" },
  not_checked: { icon: EyeOff, active: "border-ink bg-raised text-ink font-medium" },
  not_applicable: { icon: Ban, active: "border-faint bg-raised text-ink font-medium" },
};

type PhotoHandlers = {
  photos: PhotoView[];
  pending: PendingUpload[];
  onCapture: (files: File[], itemKey: string) => void;
  onDeletePhoto: (photo: PhotoView) => void;
  onOpenPhoto: (photo: PhotoView) => void;
  onRetry: (tempId: string) => void;
  onDiscard: (tempId: string) => void;
};

export function ChecklistSection({
  items,
  setStatus,
  setNotes,
  markRemainingOk,
  fuelLevel,
  setFuelLevel,
  photoHandlers,
}: {
  items: ItemsState;
  setStatus: (key: string, status: ChecklistStatus) => void;
  setNotes: (key: string, notes: string) => void;
  markRemainingOk: () => void;
  fuelLevel: FuelLevel | null;
  setFuelLevel: (v: FuelLevel) => void;
  photoHandlers: PhotoHandlers;
}) {
  const list = Object.values(items);
  const progress = checklistProgress(list);
  const groups = groupItems(list);
  const pendingCount = progress.total - progress.answered;
  const statusByKey = Object.fromEntries(list.map((i) => [i.item_key, i.status]));
  const damagedLabels = list.filter((i) => i.status === "damaged").map((i) => i.item_label);

  return (
    <SectionCard
      id="checklist"
      title="Checklist de inspeção"
      subtitle="Normal, avariado, não verificado ou não se aplica, item a item"
      complete={progress.complete}
    >
      <div className="mb-6 grid grid-cols-[112px_minmax(0,1fr)] gap-4 rounded-card bg-raised p-3 sm:grid-cols-[136px_minmax(0,1fr)] sm:gap-5 sm:p-4">
        <DamageMap statusByKey={statusByKey} showLegend={false} />
        <div className="flex min-w-0 flex-col">
          <p className="num text-sm">
            <span className="text-2xl leading-8 font-medium">{progress.answered}</span>
            <span className="text-muted"> de {progress.total} respondidos</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
            <div
              className="h-full rounded-full bg-ink transition-[width]"
              style={{ width: `${progress.total ? (progress.answered / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-3 text-sm">
            {damagedLabels.length ? (
              <>
                <span className="font-medium text-accent-ink">
                  {damagedLabels.length} avaria{damagedLabels.length > 1 ? "s" : ""}:
                </span>{" "}
                <span className="text-ink">{damagedLabels.join(", ")}</span>
              </>
            ) : (
              <span className="text-muted">Nenhuma avaria marcada até agora.</span>
            )}
          </p>
          {progress.damagedWithoutNotes > 0 && (
            <p className="mt-1 text-sm text-accent-ink">
              Falta descrever {progress.damagedWithoutNotes} avaria{progress.damagedWithoutNotes > 1 ? "s" : ""}.
            </p>
          )}
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={markRemainingOk}
              className="mt-auto inline-flex h-11 items-center justify-center gap-1.5 self-start rounded-control border border-control bg-surface px-3 text-sm font-medium hover:border-faint sm:h-9"
            >
              <CheckCheck size={16} /> Marcar os {pendingCount} pendentes como Normal
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.name}>
            <h3 className="mb-2 text-xs text-muted">{group.name}</h3>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <ChecklistRow
                  key={item.item_key}
                  item={item}
                  setStatus={setStatus}
                  setNotes={setNotes}
                  fuelLevel={item.item_key === "fuel" ? fuelLevel : undefined}
                  setFuelLevel={item.item_key === "fuel" ? setFuelLevel : undefined}
                  photos={photoHandlers.photos.filter((p) => p.item_key === item.item_key)}
                  pending={photoHandlers.pending.filter((p) => p.item_key === item.item_key)}
                  handlers={photoHandlers}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const ChecklistRow = memo(function ChecklistRow({
  item,
  setStatus,
  setNotes,
  fuelLevel,
  setFuelLevel,
  photos,
  pending,
  handlers,
}: {
  item: ChecklistItemState;
  setStatus: (key: string, status: ChecklistStatus) => void;
  setNotes: (key: string, notes: string) => void;
  fuelLevel?: FuelLevel | null;
  setFuelLevel?: (v: FuelLevel) => void;
  photos: PhotoView[];
  pending: PendingUpload[];
  handlers: PhotoHandlers;
}) {
  const [showNotes, setShowNotes] = useState(Boolean(item.notes));
  const damaged = item.status === "damaged";
  const missingNotes = damaged && !item.notes?.trim();

  return (
    <li
      className={`rounded-card border p-3 ${
        damaged ? "border-tint-2" : item.status ? "border-border" : "border-dashed border-dash"
      }`}
    >
      <div className="mb-2 flex min-h-8 items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium">
          {damaged && <span className="h-2 w-2 flex-none rounded-full bg-accent" aria-hidden="true" />}
          {item.item_label}
        </p>
        {!damaged && (
          <button
            type="button"
            onClick={() => setShowNotes((s) => !s)}
            className="inline-flex h-8 items-center gap-1 rounded-control px-2 text-xs text-muted hover:bg-raised hover:text-ink"
          >
            <MessageSquarePlus size={14} /> Observação
          </button>
        )}
      </div>

      <div role="radiogroup" aria-label={item.item_label} className="grid grid-cols-4 gap-1.5">
        {CHECKLIST_STATUS_ORDER.map((status) => {
          const { icon: Icon, active } = STATUS_STYLE[status];
          const selected = item.status === status;
          return (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setStatus(item.item_key, status)}
              className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-control border text-xs leading-tight transition sm:h-10 sm:flex-row sm:gap-1.5 sm:text-sm ${
                selected ? active : "border-control bg-surface text-muted hover:border-faint hover:text-ink"
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              <span className="sm:hidden">{CHECKLIST_STATUS[status].short}</span>
              <span className="hidden sm:inline">{CHECKLIST_STATUS[status].label}</span>
            </button>
          );
        })}
      </div>

      {setFuelLevel && (
        <div className="mt-3">
          <p className="mb-1.5 text-sm font-medium">Nível de combustível</p>
          <div role="radiogroup" aria-label="Nível de combustível" className="grid grid-cols-5 gap-1.5">
            {FUEL_LEVELS.map((f) => {
              const selected = fuelLevel === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFuelLevel(f.value)}
                  className={`relative h-11 overflow-hidden rounded-control border text-sm sm:h-10 ${
                    selected ? "border-ink font-medium text-ink" : "border-control bg-surface text-muted"
                  }`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 ${selected ? "bg-control" : "bg-raised"}`}
                    style={{ width: `${f.fraction * 100}%` }}
                    aria-hidden="true"
                  />
                  <span className="relative">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(damaged || showNotes) && (
        <div className="mt-3">
          <label className="mb-1.5 block text-sm font-medium" htmlFor={`notes-${item.item_key}`}>
            {damaged ? "Descrição da avaria" : "Observação"}
          </label>
          <textarea
            id={`notes-${item.item_key}`}
            value={item.notes ?? ""}
            onChange={(e) => setNotes(item.item_key, e.target.value)}
            placeholder={damaged ? "Local, tipo e tamanho (ex.: risco de 10 cm no canto direito)" : "Opcional"}
            aria-invalid={missingNotes || undefined}
            maxLength={2000}
            rows={2}
            className={`field-textarea min-h-20 ${missingNotes ? "border-accent" : ""}`}
          />
          {missingNotes && <p className="mt-1 text-sm text-accent-ink">Descreva a avaria para poder finalizar.</p>}
        </div>
      )}

      {damaged && (
        <div className="mt-3 space-y-2">
          {(photos.length > 0 || pending.length > 0) && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p) => (
                <PhotoTile key={p.id} photo={p} onOpen={() => handlers.onOpenPhoto(p)} onDelete={() => handlers.onDeletePhoto(p)} />
              ))}
              {pending.map((u) => (
                <PendingTile key={u.tempId} upload={u} onRetry={() => handlers.onRetry(u.tempId)} onDiscard={() => handlers.onDiscard(u.tempId)} />
              ))}
            </div>
          )}
          <CaptureButton
            variant="inline"
            label={photos.length ? "Mais uma foto" : "Fotografar a avaria"}
            allowGallery
            onFiles={(files) => handlers.onCapture(files, item.item_key)}
          />
        </div>
      )}
    </li>
  );
});
