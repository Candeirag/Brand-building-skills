"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, X } from "lucide-react";
import { deleteDraft, finalizeInspection } from "@/app/(app)/inspecoes/actions";
import { checklistProgress, type ChecklistItemState, type ChecklistStatus, type FuelLevel } from "@/lib/checklist";
import { formatDateTime, formatKm, formatPlate } from "@/lib/format";
import {
  finalizationIssues,
  formFromInspection,
  ownerSectionComplete,
  parseMileage,
  vehicleSectionComplete,
  type FormField,
  type InspectionForm,
} from "@/lib/inspection-form";
import { PHOTO_BUCKET, PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { formatDocument, formatPhone } from "@/lib/format";
import { isValidPlate, normalizePlate } from "@/lib/validation";
import { ChecklistSection } from "./checklist-section";
import { compressImage } from "./compress-image";
import { FinalizeSection } from "./finalize-section";
import { Lightbox } from "./lightbox";
import { OwnerSection } from "./owner-section";
import { PhotosSection } from "./photos-section";
import { SaveIndicator } from "./save-indicator";
import type { ItemsState, Mechanic, PendingUpload, PhotoView } from "./types";
import { clearBackup, readBackup, useAutosave } from "./use-autosave";
import { VehicleSection, type VehicleLookup } from "./vehicle-section";

type Props = {
  inspection: Tables<"inspections">;
  initialItems: ChecklistItemState[];
  initialPhotos: PhotoView[];
  mechanics: Mechanic[];
  canDelete: boolean;
};

export function InspectionEditor({ inspection, initialItems, initialPhotos, mechanics, canDelete }: Props) {
  const router = useRouter();
  const inspectionId = inspection.id;

  const [form, setForm] = useState<InspectionForm>(() => formFromInspection(inspection));
  const [items, setItems] = useState<ItemsState>(() =>
    Object.fromEntries(initialItems.map((i) => [i.item_key, i])),
  );
  const [photos, setPhotos] = useState<PhotoView[]>(initialPhotos);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [lookup, setLookup] = useState<VehicleLookup | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { state: saveState, markField, markItem, flush } = useAutosave(inspectionId, form, items);

  // ---------------------------------------------------------------------------
  // Recupera alterações não sincronizadas guardadas neste aparelho.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const backup = readBackup(inspectionId);
    if (!backup || (!backup.dirtyFields.length && !backup.dirtyItems.length)) return;
    const fields = backup.dirtyFields.filter((f) => f in backup.form);
    const keys = backup.dirtyItems.filter((k) => backup.items[k]);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauração única a partir do armazenamento local
    setForm((prev) => {
      const next = { ...prev };
      fields.forEach((f) => Object.assign(next, { [f]: backup.form[f] }));
      return next;
    });
    setItems((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        if (next[k]) next[k] = { ...next[k], status: backup.items[k]!.status, notes: backup.items[k]!.notes };
      });
      return next;
    });
    if (fields.length) markField(...fields);
    if (keys.length) markItem(...keys);
    setNotice("Recuperamos alterações feitas neste aparelho que ainda não tinham sido enviadas.");
  }, [inspectionId, markField, markItem]);

  // ---------------------------------------------------------------------------
  // Atualização de campos
  // ---------------------------------------------------------------------------
  const update = useCallback(
    <K extends keyof InspectionForm>(field: K, value: InspectionForm[K]) => {
      const changed: FormField[] = [field];
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "mechanic_name") {
          const match = mechanics.find(
            (m) => m.full_name.toLowerCase() === String(value).trim().toLowerCase(),
          );
          next.mechanic_id = match?.id ?? null;
        }
        return next;
      });
      if (field === "mechanic_name") changed.push("mechanic_id");
      setFinalizeError(null);
      markField(...changed);
    },
    [markField, mechanics],
  );

  const applyCustomer = useCallback(
    (c: { id: string; full_name: string; document: string | null; phone: string | null; whatsapp: string | null }) => {
      setForm((prev) => ({
        ...prev,
        customer_id: c.id,
        owner_name: c.full_name,
        owner_document: formatDocument(c.document),
        owner_phone: formatPhone(c.phone),
        owner_whatsapp: formatPhone(c.whatsapp),
      }));
      markField("customer_id", "owner_name", "owner_document", "owner_phone", "owner_whatsapp");
    },
    [markField],
  );

  // ---------------------------------------------------------------------------
  // Busca automática do veículo pela placa
  // ---------------------------------------------------------------------------
  const lastLookup = useRef<string | null>(null);
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    const plate = normalizePlate(form.plate);
    if (!isValidPlate(plate) || plate === lastLookup.current) return;
    lastLookup.current = plate;
    let cancelled = false;

    (async () => {
      setLookingUp(true);
      const supabase = createClient();
      const [vehicleRes, lastRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id, plate, brand, model, year, color, last_mileage, customers(id, full_name, document, phone, whatsapp, anonymized_at)")
          .eq("plate", plate)
          .maybeSingle(),
        supabase
          .from("inspections")
          .select("id, number, finalized_at, mileage")
          .eq("plate", plate)
          .eq("status", "finalized")
          .order("finalized_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setLookingUp(false);

      const vehicle = vehicleRes.data;
      if (!vehicle && !lastRes.data) {
        setLookup(null);
        return;
      }

      const current = formRef.current;
      const patch: Partial<InspectionForm> = {};
      const filled: string[] = [];
      if (vehicle) {
        const fill = (field: "brand" | "model" | "year" | "color", value: string | number | null, label: string) => {
          if (!current[field] && value !== null && value !== "") {
            patch[field] = String(value);
            filled.push(label);
          }
        };
        fill("brand", vehicle.brand, "marca");
        fill("model", vehicle.model, "modelo");
        fill("year", vehicle.year, "ano");
        fill("color", vehicle.color, "cor");
        const owner = vehicle.customers;
        const ownerEmpty = !current.owner_name && !current.owner_phone && !current.owner_whatsapp;
        if (owner && !owner.anonymized_at && ownerEmpty) {
          Object.assign(patch, {
            customer_id: owner.id,
            owner_name: owner.full_name,
            owner_document: formatDocument(owner.document),
            owner_phone: formatPhone(owner.phone),
            owner_whatsapp: formatPhone(owner.whatsapp),
          });
          filled.push("proprietário");
        }
      }
      const fields = Object.keys(patch) as FormField[];
      if (fields.length) {
        setForm((prev) => ({ ...prev, ...patch }));
        markField(...fields);
      }
      setLookup({
        plate,
        brand: vehicle?.brand ?? null,
        model: vehicle?.model ?? null,
        last_mileage: vehicle?.last_mileage ?? null,
        owner_name: vehicle?.customers && !vehicle.customers.anonymized_at ? vehicle.customers.full_name : null,
        last_inspection: lastRes.data ?? null,
        filled,
      });
    })().catch(() => {
      if (!cancelled) setLookingUp(false);
    });

    return () => {
      cancelled = true;
    };
  }, [form.plate, markField]);

  // ---------------------------------------------------------------------------
  // Checklist
  // ---------------------------------------------------------------------------
  const setStatus = useCallback(
    (key: string, status: ChecklistStatus) => {
      setItems((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], status } } : prev));
      markItem(key);
      setFinalizeError(null);
    },
    [markItem],
  );

  const setNotes = useCallback(
    (key: string, notes: string) => {
      setItems((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], notes } } : prev));
      markItem(key);
    },
    [markItem],
  );

  const markRemainingOk = useCallback(() => {
    const keys = Object.values(items)
      .filter((i) => i.status === null)
      .map((i) => i.item_key);
    if (!keys.length) return;
    setItems((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        if (next[k]) next[k] = { ...next[k], status: "ok" };
      });
      return next;
    });
    markItem(...keys);
  }, [items, markItem]);

  // ---------------------------------------------------------------------------
  // Fotografias
  // ---------------------------------------------------------------------------
  const uploadOne = useCallback(
    async (upload: PendingUpload) => {
      const supabase = createClient();
      setPending((prev) => prev.map((p) => (p.tempId === upload.tempId ? { ...p, error: undefined } : p)));
      try {
        const plate = formatPlate(formRef.current.plate);
        const stamp = `CAMPEÇAS · ${plate === "–" ? "SEM PLACA" : plate} · ${formatDateTime(new Date())}`;
        const { blob, width, height } = await compressImage(upload.file, stamp);
        const path = `${inspectionId}/${upload.category}/${crypto.randomUUID()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", upsert: false, cacheControl: "3600" });
        if (uploadError) throw uploadError;

        const { data, error } = await supabase
          .from("inspection_photos")
          .insert({
            inspection_id: inspectionId,
            category: upload.category,
            item_key: upload.item_key,
            storage_path: path,
            mime_type: "image/jpeg",
            size_bytes: blob.size,
            width,
            height,
          })
          .select("id, created_at")
          .single();
        if (error || !data) {
          await supabase.storage.from(PHOTO_BUCKET).remove([path]);
          throw error ?? new Error("Falha ao registrar a foto");
        }

        setPhotos((prev) => [
          ...prev,
          {
            id: data.id,
            category: upload.category,
            item_key: upload.item_key,
            storage_path: path,
            caption: null,
            url: URL.createObjectURL(blob),
            created_at: data.created_at,
          },
        ]);
        setPending((prev) => prev.filter((p) => p.tempId !== upload.tempId));
        URL.revokeObjectURL(upload.previewUrl);
      } catch {
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        setPending((prev) =>
          prev.map((p) =>
            p.tempId === upload.tempId ? { ...p, error: offline ? "Sem internet" : "Falha no envio" } : p,
          ),
        );
      }
    },
    [inspectionId],
  );

  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const capture = useCallback(
    async (files: File[], category: PhotoCategory, itemKey: string | null = null) => {
      const uploads: PendingUpload[] = files.map((file) => ({
        tempId: crypto.randomUUID(),
        category,
        item_key: itemKey,
        previewUrl: URL.createObjectURL(file),
        file,
      }));
      setPending((prev) => [...prev, ...uploads]);
      // Envio sequencial: menor uso de memória e de dados no celular.
      for (const u of uploads) await uploadOne(u);
    },
    [uploadOne],
  );

  const retryUpload = useCallback(
    (tempId: string) => {
      const u = pendingRef.current.find((p) => p.tempId === tempId);
      if (u) void uploadOne(u);
    },
    [uploadOne],
  );

  const discardUpload = useCallback((tempId: string) => {
    setPending((prev) => {
      const u = prev.find((p) => p.tempId === tempId);
      if (u) URL.revokeObjectURL(u.previewUrl);
      return prev.filter((p) => p.tempId !== tempId);
    });
  }, []);

  const deletePhoto = useCallback(async (photo: PhotoView) => {
    if (!window.confirm("Excluir esta foto?")) return;
    const supabase = createClient();
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
    const { error } = storageError
      ? { error: storageError }
      : await supabase.from("inspection_photos").delete().eq("id", photo.id);
    if (error) {
      setPhotos((prev) => [...prev, photo]);
      setNotice("Não foi possível excluir a foto. Verifique a conexão e tente novamente.");
    }
  }, []);

  const openPhoto = useCallback(
    (photo: PhotoView) => {
      const idx = photos.findIndex((p) => p.id === photo.id);
      if (idx >= 0) setLightbox(idx);
    },
    [photos],
  );

  // ---------------------------------------------------------------------------
  // Progresso, pendências e finalização
  // ---------------------------------------------------------------------------
  const itemList = useMemo(() => Object.values(items), [items]);
  const progress = checklistProgress(itemList);
  const issues = finalizationIssues(form, progress);

  const warnings = useMemo(() => {
    const w: string[] = [];
    const missing = PHOTO_CATEGORIES.filter((c) => c.recommended && !photos.some((p) => p.category === c.value));
    if (missing.length) w.push(`Fotos recomendadas faltando: ${missing.map((m) => m.label).join(", ")}.`);
    const damagedNoPhoto = itemList.filter(
      (i) => i.status === "damaged" && !photos.some((p) => p.item_key === i.item_key),
    );
    if (damagedNoPhoto.length)
      w.push(`Avarias sem foto: ${damagedNoPhoto.map((i) => i.item_label).join(", ")}.`);
    const km = parseMileage(form.mileage);
    const last = lookup?.last_mileage ?? lookup?.last_inspection?.mileage;
    if (km !== null && last != null && km < last)
      w.push(`Quilometragem menor que a última registrada (${formatKm(last)}). Confira o hodômetro.`);
    if (pending.length) w.push("Há fotos aguardando envio.");
    return w;
  }, [photos, itemList, form.mileage, lookup, pending.length]);

  const damagedLabels = itemList.filter((i) => i.status === "damaged").map((i) => i.item_label);

  async function handleFinalize() {
    setFinalizeError(null);
    if (pending.some((p) => !p.error)) {
      setFinalizeError("Aguarde o envio das fotos antes de finalizar.");
      return;
    }
    setFinalizing(true);
    const saved = await flush();
    if (!saved) {
      setFinalizing(false);
      setFinalizeError("Não foi possível salvar as últimas alterações. Verifique a conexão e tente novamente.");
      return;
    }
    const result = await finalizeInspection(inspectionId);
    if (!result.ok) {
      setFinalizing(false);
      setFinalizeError(result.error);
      return;
    }
    clearBackup(inspectionId);
    router.replace(`/inspecoes/${inspectionId}?finalizada=1`);
  }

  async function handleDelete() {
    if (!window.confirm("Excluir este rascunho e todas as fotos? Esta ação não pode ser desfeita.")) return;
    const result = await deleteDraft(inspectionId);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    clearBackup(inspectionId);
    router.replace("/");
  }

  const sections = [
    { id: "veiculo", label: "Veículo", done: vehicleSectionComplete(form) },
    { id: "proprietario", label: "Cliente", done: ownerSectionComplete(form) },
    { id: "checklist", label: "Checklist", done: progress.complete },
    {
      id: "fotos",
      label: "Fotos",
      done: PHOTO_CATEGORIES.filter((c) => c.recommended).every((c) => photos.some((p) => p.category === c.value)),
    },
    { id: "finalizacao", label: "Finalizar", done: issues.length === 0 },
  ];

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div>
      {/* Barra da inspeção */}
      <div className="sticky top-0 z-20 border-b border-border bg-ground pt-[env(safe-area-inset-top)] lg:pt-0">
        <div className="mx-auto flex h-12 max-w-3xl items-center gap-2 pr-4 pl-1 sm:px-6">
          <Link href="/" className="flex h-11 w-11 flex-none items-center justify-center rounded-control hover:bg-raised" aria-label="Voltar ao painel">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold">
            {isValidPlate(form.plate) ? (
              <span className="id-type">{formatPlate(form.plate)}</span>
            ) : (
              "Nova inspeção"
            )}
            <span className="ml-2 text-sm font-normal text-muted">rascunho</span>
          </h1>
          <SaveIndicator state={saveState} />
        </div>
        <nav className="mx-auto grid max-w-3xl grid-cols-5 gap-1.5 px-4 pb-2.5 sm:px-6" aria-label="Seções da inspeção">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className={`inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-full border px-1.5 text-xs ${
                s.done ? "border-positive/30 bg-positive-bg text-positive-ink" : "border-control bg-surface text-muted hover:text-ink"
              }`}
            >
              {s.done && <Check size={12} strokeWidth={2.5} className="flex-none" />}
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {notice && (
        <div className="mx-auto mt-4 max-w-3xl px-4 sm:px-6">
          <div role="status" className="flex items-start gap-3 rounded-card border border-border bg-surface px-4 py-3 text-sm">
            <span className="flex-1">{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Fechar aviso" className="text-muted">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <VehicleSection
          form={form}
          update={update}
          startedAt={inspection.started_at}
          lookup={lookup}
          lookingUp={lookingUp}
        />
        <OwnerSection form={form} update={update} applyCustomer={applyCustomer} />
        <ChecklistSection
          items={items}
          setStatus={setStatus}
          setNotes={setNotes}
          markRemainingOk={markRemainingOk}
          fuelLevel={form.fuel_level}
          setFuelLevel={(v: FuelLevel) => update("fuel_level", v)}
          photoHandlers={{
            photos,
            pending,
            onCapture: (files, itemKey) => void capture(files, "damage", itemKey),
            onDeletePhoto: (p) => void deletePhoto(p),
            onOpenPhoto: openPhoto,
            onRetry: retryUpload,
            onDiscard: discardUpload,
          }}
        />
        <PhotosSection
          photos={photos}
          pending={pending}
          onCapture={(files, category) => void capture(files, category)}
          onDeletePhoto={(p) => void deletePhoto(p)}
          onOpenPhoto={openPhoto}
          onRetry={retryUpload}
          onDiscard={discardUpload}
        />
        <FinalizeSection
          form={form}
          update={update}
          mechanics={mechanics}
          issues={issues}
          warnings={warnings}
          damagedLabels={damagedLabels}
          finalizing={finalizing}
          finalizeError={finalizeError}
          onFinalize={() => void handleFinalize()}
          onDelete={() => void handleDelete()}
          canDelete={canDelete}
        />
      </main>

      {/* Atalho para a finalização (celular) */}
      <div className="no-print sticky bottom-0 z-20 flex items-center gap-3 border-t border-border bg-surface px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.625rem)] sm:hidden">
        <p className="min-w-0 flex-1 text-sm">
          {issues.length ? (
            <>
              <span className="num font-medium">{issues.length}</span>
              <span className="text-muted"> pendência{issues.length > 1 ? "s" : ""} para finalizar</span>
            </>
          ) : (
            <span className="font-medium text-positive">Pronta para finalizar</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => scrollTo("finalizacao")}
          className="inline-flex h-11 flex-none items-center gap-1 rounded-control border border-control px-3.5 text-sm font-medium"
        >
          Finalização <ChevronRight size={16} />
        </button>
      </div>

      <Lightbox
        photos={photos.map((p) => ({
          url: p.url,
          caption: p.caption,
          label:
            p.item_key && items[p.item_key]
              ? `Avaria · ${items[p.item_key]!.item_label}`
              : PHOTO_CATEGORIES.find((c) => c.value === p.category)?.label,
        }))}
        index={lightbox}
        onIndex={setLightbox}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
