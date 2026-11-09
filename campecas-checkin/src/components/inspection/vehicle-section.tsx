"use client";

import { CalendarClock, History, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatDateTime, formatKm, formatNumber } from "@/lib/format";
import { fieldErrors, parseMileage, vehicleSectionComplete, type InspectionForm } from "@/lib/inspection-form";
import { normalizePlate, onlyDigits } from "@/lib/validation";
import { ChoiceChips, SectionCard, TextField } from "./fields";

const BRANDS = [
  "Chevrolet", "Volkswagen", "Fiat", "Ford", "Toyota", "Hyundai", "Honda", "Renault", "Jeep", "Nissan",
  "Peugeot", "Citroën", "Mitsubishi", "Kia", "BYD", "Caoa Chery", "GWM", "BMW", "Mercedes-Benz", "Audi",
  "Volvo", "Land Rover", "RAM", "Suzuki", "Subaru", "Porsche", "JAC", "Troller",
];

const COLORS = ["Branco", "Preto", "Prata", "Cinza", "Vermelho", "Azul", "Marrom", "Bege", "Verde", "Amarelo"];

export type VehicleLookup = {
  plate: string;
  brand: string | null;
  model: string | null;
  last_mileage: number | null;
  owner_name: string | null;
  last_inspection: { id: string; number: string | null; finalized_at: string | null; mileage: number | null } | null;
  filled: string[];
};

export function VehicleSection({
  form,
  update,
  startedAt,
  lookup,
  lookingUp,
}: {
  form: InspectionForm;
  update: <K extends keyof InspectionForm>(field: K, value: InspectionForm[K]) => void;
  startedAt: string;
  lookup: VehicleLookup | null;
  lookingUp: boolean;
}) {
  const errors = fieldErrors(form);
  const mileage = parseMileage(form.mileage);
  const lastKnown = lookup?.last_mileage ?? lookup?.last_inspection?.mileage ?? null;
  const mileageWarning =
    mileage !== null && lastKnown !== null && mileage < lastKnown
      ? `Atenção: menor que a última registrada (${formatKm(lastKnown)}).`
      : undefined;

  return (
    <SectionCard
      id="veiculo"
      step={1}
      title="Veículo"
      subtitle="Placa, identificação e quilometragem"
      complete={vehicleSectionComplete(form)}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField
            label="Placa"
            value={form.plate}
            onValueChange={(v) => update("plate", normalizePlate(v))}
            error={errors.plate}
            hint={lookingUp ? "Buscando cadastro…" : "Padrão antigo ou Mercosul"}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={8}
            placeholder="ABC1D23"
            inputClassName="h-16 text-center font-mono text-3xl font-bold tracking-[0.25em] uppercase"
            enterKeyHint="next"
          />
        </div>

        {lookup && (
          <div className="rounded-xl border border-ink/10 bg-paper p-4 sm:col-span-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={16} className="text-brand-red" />
              Veículo já atendido pela oficina
            </p>
            <p className="mt-1 text-sm text-graphite">
              {[lookup.brand, lookup.model].filter(Boolean).join(" ") || "—"}
              {lookup.owner_name && <> · {lookup.owner_name}</>}
              {lastKnown !== null && <> · última km {formatKm(lastKnown)}</>}
            </p>
            {lookup.filled.length > 0 && (
              <p className="mt-1 text-xs text-steel">Preenchido automaticamente: {lookup.filled.join(", ")}.</p>
            )}
            {lookup.last_inspection && (
              <Link
                href={`/veiculos/${lookup.plate}`}
                target="_blank"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-red"
              >
                <History size={15} /> Ver histórico ({lookup.last_inspection.number},{" "}
                {formatDateTime(lookup.last_inspection.finalized_at)})
              </Link>
            )}
          </div>
        )}

        <TextField
          label="Marca"
          value={form.brand}
          onValueChange={(v) => update("brand", v)}
          list="marcas"
          autoComplete="off"
          placeholder="Ex.: Volkswagen"
          enterKeyHint="next"
        />
        <datalist id="marcas">
          {BRANDS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>

        <TextField
          label="Modelo"
          value={form.model}
          onValueChange={(v) => update("model", v)}
          autoComplete="off"
          placeholder="Ex.: Gol 1.0 MPI"
          enterKeyHint="next"
        />

        <TextField
          label="Ano"
          value={form.year}
          onValueChange={(v) => update("year", onlyDigits(v).slice(0, 4))}
          error={errors.year}
          inputMode="numeric"
          placeholder="2020"
          maxLength={4}
          enterKeyHint="next"
        />

        <TextField
          label="Quilometragem"
          value={form.mileage}
          onValueChange={(v) => {
            const d = onlyDigits(v).slice(0, 7);
            update("mileage", d ? formatNumber(Number(d)) : "");
          }}
          error={errors.mileage}
          hint={mileageWarning}
          inputMode="numeric"
          placeholder="0"
          suffix="km"
          enterKeyHint="done"
        />

        <div className="sm:col-span-2">
          <TextField
            label="Cor"
            value={form.color}
            onValueChange={(v) => update("color", v)}
            autoComplete="off"
            placeholder="Selecione ou digite"
          />
          <div className="mt-2.5">
            <ChoiceChips
              label="Cores comuns"
              options={COLORS.map((c) => ({ value: c, label: c }))}
              value={form.color}
              onChange={(c) => update("color", c)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-paper px-4 py-3 text-sm text-graphite sm:col-span-2">
          <CalendarClock size={20} className="shrink-0 text-steel" />
          <span>
            Entrada registrada em <strong>{formatDateTime(startedAt)}</strong> (automático)
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
