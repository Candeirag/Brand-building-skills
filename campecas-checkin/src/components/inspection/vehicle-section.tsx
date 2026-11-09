"use client";

import { CalendarClock, History } from "lucide-react";
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
            hint={lookingUp ? "Buscando cadastro…" : "Mercosul (ABC1D23) ou antiga (ABC1234)"}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={8}
            placeholder="Digite a placa"
            inputClassName="h-14 text-center id-type text-2xl font-bold tracking-[0.2em] uppercase"
            enterKeyHint="next"
          />
        </div>

        {lookup && (
          <div className="rounded-card border border-tint-2 bg-tint px-4 py-3 sm:col-span-2">
            <p className="text-sm font-medium text-accent-ink">
              Veículo já atendido pela oficina
            </p>
            <p className="mt-0.5 text-sm text-ink">
              {[lookup.brand, lookup.model].filter(Boolean).join(" ") || "–"}
              {lookup.owner_name && <> · {lookup.owner_name}</>}
              {lastKnown !== null && <> · última km {formatKm(lastKnown)}</>}
            </p>
            {lookup.filled.length > 0 && (
              <p className="mt-0.5 text-xs text-muted">Preenchido automaticamente: {lookup.filled.join(", ")}.</p>
            )}
            {lookup.last_inspection && (
              <Link
                href={`/veiculos/${lookup.plate}`}
                target="_blank"
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-2 hover:underline"
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
          placeholder="Ex.: 2020"
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
          placeholder="Leia no hodômetro"
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
          <div className="mt-2">
            <ChoiceChips
              label="Cores comuns"
              options={COLORS.map((c) => ({ value: c, label: c }))}
              value={form.color}
              onChange={(c) => update("color", c)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-muted sm:col-span-2">
          <CalendarClock size={16} className="shrink-0" />
          <span>
            Entrada registrada automaticamente em <span className="num text-ink">{formatDateTime(startedAt)}</span>
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
