"use client";

import { useState } from "react";
import { Copy, LoaderCircle, Search, ShieldCheck, UserCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDocument, formatPhone, maskDocument } from "@/lib/format";
import { fieldErrors, ownerSectionComplete, type InspectionForm } from "@/lib/inspection-form";
import { onlyDigits } from "@/lib/validation";
import { SectionCard, TextField } from "./fields";

type CustomerResult = {
  id: string;
  full_name: string;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export function OwnerSection({
  form,
  update,
  applyCustomer,
}: {
  form: InspectionForm;
  update: <K extends keyof InspectionForm>(field: K, value: InspectionForm[K]) => void;
  applyCustomer: (c: CustomerResult) => void;
}) {
  const errors = fieldErrors(form);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CustomerResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function search() {
    const digits = onlyDigits(query);
    if (digits.length < 8) {
      setSearchError("Digite o telefone com DDD ou o CPF/CNPJ completo.");
      return;
    }
    setSearching(true);
    setSearchError(null);
    const supabase = createClient();
    const filter =
      digits.length === 11 || digits.length === 14
        ? `phone.eq.${digits},whatsapp.eq.${digits},document.eq.${digits}`
        : `phone.eq.${digits},whatsapp.eq.${digits}`;
    const { data, error } = await supabase
      .from("customers")
      .select("id, full_name, document, phone, whatsapp")
      .is("anonymized_at", null)
      .or(filter)
      .limit(5);
    setSearching(false);
    if (error) {
      setSearchError("Não foi possível buscar agora. Verifique a conexão.");
      return;
    }
    setResults(data ?? []);
  }

  return (
    <SectionCard
      id="proprietario"
      step={2}
      title="Proprietário"
      subtitle="Identificação e contato do cliente"
      complete={ownerSectionComplete(form)}
    >
      <div className="mb-5 rounded-xl border border-line bg-paper p-3 sm:p-4">
        <p className="mb-2 text-sm font-semibold text-graphite">Cliente já cadastrado?</p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
            inputMode="numeric"
            placeholder="Telefone ou CPF/CNPJ"
            aria-label="Buscar cliente por telefone ou CPF/CNPJ"
            className="field-input h-12 flex-1"
          />
          <button
            type="button"
            onClick={() => void search()}
            disabled={searching}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {searching ? <LoaderCircle size={18} className="animate-spin" /> : <Search size={18} />}
            Buscar
          </button>
        </div>
        {searchError && <p className="mt-2 text-sm text-brand-red">{searchError}</p>}
        {results && (
          <div className="mt-3">
            {results.length === 0 ? (
              <p className="text-sm text-steel">Nenhum cliente encontrado. Preencha os dados abaixo.</p>
            ) : (
              <ul className="space-y-2">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        applyCustomer(c);
                        setResults(null);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-left hover:border-ink"
                    >
                      <UserCheck size={20} className="shrink-0 text-ok" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{c.full_name}</span>
                        <span className="block truncate text-xs text-steel">
                          {[formatPhone(c.whatsapp ?? c.phone), c.document && maskDocument(c.document)]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-brand-red">Usar</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {form.customer_id && (
        <div className="mb-5 flex items-center justify-between gap-2 rounded-xl bg-ok-soft px-4 py-2.5 text-sm text-ok">
          <span className="flex items-center gap-2 font-semibold">
            <UserCheck size={18} /> Cliente vinculado ao cadastro
          </span>
          <button
            type="button"
            onClick={() => update("customer_id", null)}
            className="flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline"
          >
            <X size={14} /> Desvincular
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          className="sm:col-span-2"
          label="Nome completo"
          value={form.owner_name}
          onValueChange={(v) => update("owner_name", v)}
          autoComplete="off"
          autoCapitalize="words"
          placeholder="Nome do proprietário ou responsável"
        />
        <TextField
          label="CPF / CNPJ"
          value={form.owner_document}
          onValueChange={(v) => update("owner_document", formatDocument(onlyDigits(v).slice(0, 14)))}
          error={errors.owner_document}
          hint="Opcional"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
        />
        <TextField
          label="Telefone"
          value={form.owner_phone}
          onValueChange={(v) => update("owner_phone", formatPhone(onlyDigits(v).slice(0, 11)))}
          error={errors.owner_phone}
          inputMode="tel"
          type="tel"
          autoComplete="off"
          placeholder="(00) 00000-0000"
        />
        <div className="sm:col-span-2">
          <TextField
            label="WhatsApp"
            value={form.owner_whatsapp}
            onValueChange={(v) => update("owner_whatsapp", formatPhone(onlyDigits(v).slice(0, 11)))}
            error={errors.owner_whatsapp}
            inputMode="tel"
            type="tel"
            autoComplete="off"
            placeholder="(00) 00000-0000"
          />
          {form.owner_phone && form.owner_phone !== form.owner_whatsapp && (
            <button
              type="button"
              onClick={() => update("owner_whatsapp", form.owner_phone)}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-graphite"
            >
              <Copy size={15} /> Mesmo número do telefone
            </button>
          )}
        </div>
      </div>

      <p className="mt-5 flex gap-2 text-xs leading-relaxed text-steel">
        <ShieldCheck size={16} className="shrink-0 text-steel" />
        Dados pessoais usados somente para identificação do proprietário e contato sobre o serviço, conforme a LGPD
        (Lei 13.709/2018). Informe ao cliente.
      </p>
    </SectionCard>
  );
}
