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
    <SectionCard id="finalizacao" step={5} title="Finalização" subtitle="Responsáveis, observações e confirmação" complete={ready}>
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
                className={`h-9 rounded-full border px-3.5 text-sm font-semibold ${
                  form.mechanic_name === m.full_name ? "border-ink bg-ink text-white" : "border-line bg-white text-graphite"
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
        <div className="mt-6 rounded-xl border border-brand-red/30 bg-brand-red-soft/50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-red-dark">
            <AlertTriangle size={18} /> Avarias preexistentes registradas ({damagedLabels.length})
          </p>
          <p className="mt-1 text-sm text-graphite">{damagedLabels.join(" · ")}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="mt-4 space-y-1.5 rounded-xl bg-warn-soft p-4 text-sm text-warn">
          {warnings.map((w) => (
            <li key={w} className="flex gap-2">
              <CircleAlert size={17} className="mt-0.5 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}

      <label
        className={`mt-6 flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition ${
          form.checklist_confirmed ? "border-ok bg-ok-soft" : "border-line bg-white"
        }`}
      >
        <input
          type="checkbox"
          checked={form.checklist_confirmed}
          onChange={(e) => update("checklist_confirmed", e.target.checked)}
          className="mt-0.5 h-7 w-7 shrink-0 accent-[#15803d]"
        />
        <span>
          <span className="block font-semibold">Confirmo que o checklist foi concluído</span>
          <span className="block text-sm text-steel">
            As condições registradas correspondem ao estado do veículo na entrada. Após finalizar, a inspeção não poderá
            ser alterada.
          </span>
        </span>
      </label>

      {!ready && (
        <div className="mt-4 rounded-xl bg-paper p-4">
          <p className="mb-2 text-sm font-bold text-graphite">Antes de finalizar:</p>
          <ul className="space-y-1 text-sm text-graphite">
            {issues.map((i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" /> {i}
              </li>
            ))}
          </ul>
        </div>
      )}

      {finalizeError && (
        <p role="alert" className="mt-4 rounded-xl bg-brand-red-soft px-4 py-3 text-sm font-medium text-brand-red-dark">
          {finalizeError}
        </p>
      )}

      <button
        type="button"
        onClick={onFinalize}
        disabled={!ready || finalizing}
        className={buttonClass("primary", "xl", "mt-6 w-full")}
      >
        {finalizing ? <LoaderCircle size={24} className="animate-spin" /> : ready ? <Flag size={24} /> : <CheckCircle2 size={24} />}
        Finalizar inspeção
      </button>

      {canDelete && (
        <button type="button" onClick={onDelete} className={buttonClass("ghost", "md", "mt-3 w-full text-brand-red")}>
          <Trash2 size={18} /> Excluir rascunho
        </button>
      )}
    </SectionCard>
  );
}
