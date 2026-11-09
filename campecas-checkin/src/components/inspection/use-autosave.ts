"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { toInspectionPatch, type FormField, type InspectionForm } from "@/lib/inspection-form";
import type { ItemsState, SaveState } from "./types";

const SAVE_DELAY_MS = 900;
const RETRY_DELAY_MS = 5000;

export type DraftBackup = {
  form: InspectionForm;
  items: ItemsState;
  dirtyFields: FormField[];
  dirtyItems: string[];
  at: number;
};

export function backupKey(inspectionId: string) {
  return `campecas:rascunho:${inspectionId}`;
}

export function readBackup(inspectionId: string): DraftBackup | null {
  try {
    const raw = localStorage.getItem(backupKey(inspectionId));
    return raw ? (JSON.parse(raw) as DraftBackup) : null;
  } catch {
    return null;
  }
}

export function clearBackup(inspectionId: string) {
  try {
    localStorage.removeItem(backupKey(inspectionId));
  } catch {
    // armazenamento indisponível (ex.: navegação privada)
  }
}

/**
 * Salvamento automático do rascunho:
 * - grava no Supabase alguns instantes após cada alteração;
 * - mantém cópia no aparelho (localStorage) para não perder nada sem internet;
 * - reenvia ao reconectar, ao minimizar o app e periodicamente em caso de erro.
 */
export function useAutosave(inspectionId: string, form: InspectionForm, items: ItemsState) {
  const formRef = useRef(form);
  const itemsRef = useRef(items);
  const dirtyFields = useRef(new Set<FormField>());
  const dirtyItems = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const [state, setState] = useState<SaveState>({ kind: "idle" });

  const persistBackup = useCallback(() => {
    try {
      const backup: DraftBackup = {
        form: formRef.current,
        items: itemsRef.current,
        dirtyFields: [...dirtyFields.current],
        dirtyItems: [...dirtyItems.current],
        at: Date.now(),
      };
      localStorage.setItem(backupKey(inspectionId), JSON.stringify(backup));
    } catch {
      // armazenamento indisponível
    }
  }, [inspectionId]);

  // Mantém as referências atualizadas e a cópia local sempre em dia.
  useEffect(() => {
    formRef.current = form;
    itemsRef.current = items;
    persistBackup();
  }, [form, items, persistBackup]);

  const flushRef = useRef<() => Promise<boolean>>(async () => true);

  const schedule = useCallback((delay = SAVE_DELAY_MS) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), delay);
  }, []);

  const doFlush = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    if (!dirtyFields.current.size && !dirtyItems.current.size) return true;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setState({ kind: "offline" });
      return false;
    }

    const fields = [...dirtyFields.current];
    const keys = [...dirtyItems.current];
    dirtyFields.current.clear();
    dirtyItems.current.clear();
    setState({ kind: "saving" });

    const supabase = createClient();
    try {
      if (fields.length) {
        const { data, error } = await supabase
          .from("inspections")
          .update(toInspectionPatch(formRef.current, fields))
          .eq("id", inspectionId)
          .select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("Esta inspeção foi finalizada ou excluída por outro usuário.");
      }
      if (keys.length) {
        const rows = keys
          .map((k) => itemsRef.current[k])
          .filter((i) => i !== undefined)
          .map((i) => ({
            inspection_id: inspectionId,
            item_key: i.item_key,
            item_label: i.item_label,
            group_name: i.group_name,
            position: i.position,
            status: i.status,
            notes: i.notes?.trim() ? i.notes.slice(0, 2000) : null,
          }));
        const { error } = await supabase.from("inspection_items").upsert(rows, { onConflict: "inspection_id,item_key" });
        if (error) throw error;
      }
      setState({ kind: "saved", at: new Date() });
      persistBackup();
      return true;
    } catch (error) {
      fields.forEach((f) => dirtyFields.current.add(f));
      keys.forEach((k) => dirtyItems.current.add(k));
      persistBackup();
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setState(offline ? { kind: "offline" } : { kind: "error", message: friendlyError(error, "Falha ao salvar. Tentando novamente…") });
      schedule(RETRY_DELAY_MS);
      return false;
    }
  }, [inspectionId, persistBackup, schedule]);

  /** Salva imediatamente (aguarda um salvamento em andamento). */
  const flush = useCallback(async (): Promise<boolean> => {
    while (inFlight.current) await inFlight.current;
    const p = doFlush();
    inFlight.current = p;
    try {
      return await p;
    } finally {
      inFlight.current = null;
    }
  }, [doFlush]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const markField = useCallback(
    (...fields: FormField[]) => {
      fields.forEach((f) => dirtyFields.current.add(f));
      schedule();
    },
    [schedule],
  );

  const markItem = useCallback(
    (...keys: string[]) => {
      keys.forEach((k) => dirtyItems.current.add(k));
      schedule();
    },
    [schedule],
  );

  const hasPending = useCallback(() => dirtyFields.current.size > 0 || dirtyItems.current.size > 0, []);

  useEffect(() => {
    const onOnline = () => void flushRef.current();
    const onOffline = () => setState({ kind: "offline" });
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flushRef.current();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyFields.current.size || dirtyItems.current.size) {
        void flushRef.current();
        e.preventDefault();
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearTimeout(timer.current);
    };
  }, []);

  return { state, markField, markItem, flush, hasPending };
}
