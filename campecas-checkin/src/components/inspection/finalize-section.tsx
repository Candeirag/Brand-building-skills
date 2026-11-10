"use client";

import { AlertTriangle, CheckCircle2, CircleAlert, Flag, LoaderCircle, Trash2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import type { InspectionForm } from "@/lib/inspection-form";
import { SectionCard, TextField } from "./fields";
import type { Mechanic } from "./types";

export function FinalizeSection({
  form,
  update,
  mechanics,
  issues,
  warnings,
  damagedLabels,
  finalizing,
  finalizeError,
  onFinalize,
  onDelete,
  canDelete,
}: {
  form: InspectionForm;
  update: <K extends keyof InspectionForm>(field: K, value: InspectionForm[K]) => void;
  mechanics: Mechanic[];
  issues: string[];
  warnings: string[];
  damagedLabels: string[];
  finalizing: boolean;
  finalizeError: string | null;
  onFinalize: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const ready = issues.length === 0;

  return (
    <SectionCard id="finalizacao" title="Finalização" subtitle="Responsáveis, observações e confirmação" complete={ready}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Funcionário responsável"
          value={form.inspector_name}
          onValueChange={(v) => update("inspector_name", v)}
          autoComplete="off"
        />
        <TextField
          label="Mecânico responsável"
          value={form.mechanic_name}
          onValueChange={(v) => update("mechanic_name", v)}
          list="mecanicos"
          autoComplete="off"
          placeholder={mechanics.length ? "Selecione ou digite" : "Nome do mecânico"}
        />
        <datalist id="mecanicos">
          {mechanics.map((m) => (
            <option key={m.id} value={m.full_name} />
          ))}
        </datalist>
        {mechanics.length > 0 && (
          <div className="-mt-2 flex flex-wrap gap-2 sm:col-span-2">
            {mechanics.slice(0, 8).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => update("mechanic_name", m.full_name)}
                className={`h-9 rounded-full border px-3.5 text-sm ${
                  form.mechanic_name === m.full_name ? "border-ink bg-ink font-medium text-white" : "border-control bg-surface text-ink hover:border-faint"
                }`}
              >
                {m.full_name}
              </button>
            ))}
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="field-label">
            Observações
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            maxLength={5000}
            rows={4}
            placeholder="Relato do cliente, serviços solicitados, itens deixados no veículo, combinações…"
            className="field-textarea"
          />
        </div>
      </div>

      {damagedLabels.length > 0 && (
        <div className="mt-6 rounded-card border border-tint-2 bg-tint px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-accent-ink">
            <AlertTriangle size={16} />{" "}
            {damagedLabels.length === 1
              ? "1 avaria preexistente vai para o laudo"
              : `${damagedLabels.length} avarias preexistentes vão para o laudo`}
          </p>
          <p className="mt-0.5 text-sm text-ink">{damagedLabels.join(" · ")}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="mt-4 space-y-1.5 rounded-card border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-ink">
          {warnings.map((w) => (
            <li key={w} className="flex gap-2">
              <CircleAlert size={15} className="mt-0.5 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}

      <label
        className={`mt-6 flex cursor-pointer items-start gap-3 rounded-card border p-4 transition ${
          form.checklist_confirmed ? "border-positive/40 bg-positive-bg" : "border-control bg-surface"
        }`}
      >
        <input
          type="checkbox"
          checked={form.checklist_confirmed}
          onChange={(e) => update("checklist_confirmed", e.target.checked)}
          className="mt-0.5 h-6 w-6 shrink-0 accent-[#247b50]"
        />
        <span>
          <span className="block font-medium">Confirmo que o checklist foi concluído</span>
          <span className="block text-sm text-muted">
            As condições registradas correspondem ao estado do veículo na entrada. Após finalizar, a inspeção não poderá
            ser alterada.
          </span>
        </span>
      </label>

      {!ready && (
        <div className="mt-4 rounded-card bg-raised px-4 py-3">
          <p className="mb-1.5 text-sm font-medium">Falta para finalizar</p>
          <ul className="space-y-1 text-sm text-ink">
            {issues.map((i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-faint" /> {i}
              </li>
            ))}
          </ul>
        </div>
      )}

      {finalizeError && (
        <p role="alert" className="mt-4 rounded-card border border-tint-2 bg-tint px-4 py-3 text-sm text-accent-ink">
          {finalizeError}
        </p>
      )}

      <button
        type="button"
        onClick={onFinalize}
        disabled={!ready || finalizing}
        className={buttonClass("primary", "lg", "mt-6 h-12 w-full")}
      >
        {finalizing ? <LoaderCircle size={18} className="animate-spin" /> : ready ? <Flag size={18} /> : <CheckCircle2 size={18} />}
        Finalizar inspeção
      </button>

      {canDelete && (
        <button type="button" onClick={onDelete} className={buttonClass("ghost", "lg", "mt-3 w-full text-accent-ink")}>
          <Trash2 size={16} /> Excluir este rascunho e as fotos
        </button>
      )}
    </SectionCard>
  );
}
