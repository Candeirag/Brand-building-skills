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
import { SectionCard } from "./fields";
import { CaptureButton, PendingTile, PhotoTile } from "./photo-widgets";
import type { ItemsState, PendingUpload, PhotoView } from "./types";

const STATUS_STYLE: Record<ChecklistStatus, { icon: typeof Check; active: string }> = {
  ok: { icon: Check, active: "border-ok bg-ok text-white" },
  damaged: { icon: AlertTriangle, active: "border-brand-red bg-brand-red text-white" },
  not_checked: { icon: EyeOff, active: "border-graphite bg-graphite text-white" },
  not_applicable: { icon: Ban, active: "border-steel bg-steel text-white" },
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

  return (
    <SectionCard
      id="checklist"
      step={3}
      title="Checklist de inspeção"
      subtitle={`${progress.answered} de ${progress.total} itens · ${progress.damaged} avaria(s)`}
      complete={progress.complete}
    >
      <div className="-mx-4 -mt-4 mb-4 border-b border-line bg-white px-4 py-3 sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${progress.total ? (progress.answered / progress.total) * 100 : 0}%` }}
            />
          </div>
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={markRemainingOk}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-ok/30 bg-ok-soft px-3 text-sm font-semibold text-ok"
            >
              <CheckCheck size={18} /> Pendentes = Normal ({pendingCount})
            </button>
          )}
        </div>
      </div>

      <div className="space-y-7">
        {groups.map((group) => (
          <div key={group.name}>
            <h3 className="display mb-3 text-sm font-bold tracking-[0.18em] text-steel">{group.name}</h3>
            <ul className="space-y-3">
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
      className={`rounded-xl border p-3 transition sm:p-4 ${
        damaged ? "border-brand-red/40 bg-brand-red-soft/40" : item.status ? "border-line" : "border-dashed border-graphite/25"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-semibold">{item.item_label}</p>
        {!damaged && (
          <button
            type="button"
            onClick={() => setShowNotes((s) => !s)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-steel hover:bg-paper"
          >
            <MessageSquarePlus size={15} /> Obs.
          </button>
        )}
      </div>

      <div role="radiogroup" aria-label={item.item_label} className="grid grid-cols-4 gap-1.5 sm:gap-2">
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
              className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] leading-tight font-semibold transition active:scale-95 sm:h-12 sm:flex-row sm:gap-1.5 sm:text-sm ${
                selected ? active : "border-line bg-white text-graphite hover:border-graphite/40"
              }`}
            >
              <Icon size={18} strokeWidth={2.5} />
              <span className="sm:hidden">{CHECKLIST_STATUS[status].short}</span>
              <span className="hidden sm:inline">{CHECKLIST_STATUS[status].label}</span>
            </button>
          );
        })}
      </div>

      {setFuelLevel && (
        <div className="mt-3">
          <p className="mb-1.5 text-sm font-semibold text-graphite">Nível de combustível</p>
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
                  className={`relative h-12 overflow-hidden rounded-lg border text-sm font-bold ${
                    selected ? "border-ink text-white" : "border-line bg-white text-graphite"
                  }`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 ${selected ? "bg-ink" : "bg-paper"}`}
                    style={{ width: `${f.fraction * 100}%` }}
                    aria-hidden="true"
                  />
                  <span className={`relative ${selected ? "drop-shadow" : ""}`}>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(damaged || showNotes) && (
        <div className="mt-3">
          <label className="sr-only" htmlFor={`notes-${item.item_key}`}>
            {damaged ? "Descrição da avaria" : "Observação"}
          </label>
          <textarea
            id={`notes-${item.item_key}`}
            value={item.notes ?? ""}
            onChange={(e) => setNotes(item.item_key, e.target.value)}
            placeholder={damaged ? "Descreva a avaria: local, tipo e extensão (ex.: risco de 10 cm na lateral direita)" : "Observação (opcional)"}
            aria-invalid={missingNotes || undefined}
            maxLength={2000}
            rows={2}
            className={`field-textarea min-h-20 ${missingNotes ? "border-brand-red" : ""}`}
          />
          {missingNotes && <p className="mt-1 text-sm font-medium text-brand-red">Descreva a avaria para finalizar.</p>}
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
                <PendingTile
                  key={u.tempId}
                  upload={u}
                  onRetry={() => handlers.onRetry(u.tempId)}
                  onDiscard={() => handlers.onDiscard(u.tempId)}
                />
              ))}
            </div>
          )}
          <CaptureButton
            variant="inline"
            label={photos.length ? "Mais uma foto" : "Fotografar avaria"}
            allowGallery
            onFiles={(files) => handlers.onCapture(files, item.item_key)}
          />
        </div>
      )}
    </li>
  );
});
