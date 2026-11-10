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
      title="Proprietário"
      subtitle="Identificação, contato e o que o cliente pediu"
      complete={ownerSectionComplete(form)}
    >
      <div className="mb-5 rounded-card bg-raised p-3 sm:p-4">
        <p className="mb-2 text-sm font-medium">Cliente já cadastrado?</p>
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
            className="field-input flex-1"
          />
          <button
            type="button"
            onClick={() => void search()}
            disabled={searching}
            className="inline-flex h-11 items-center gap-2 rounded-control border border-control bg-surface px-3.5 text-sm font-medium hover:border-faint disabled:opacity-60"
          >
            {searching ? <LoaderCircle size={18} className="animate-spin" /> : <Search size={18} />}
            Buscar
          </button>
        </div>
        {searchError && <p className="mt-2 text-sm text-accent-ink">{searchError}</p>}
        {results && (
          <div className="mt-3">
            {results.length === 0 ? (
              <p className="text-sm text-muted">Nenhum cliente encontrado. Preencha os dados abaixo.</p>
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
                      className="flex min-h-14 w-full items-center gap-3 rounded-control border border-border bg-surface px-3 py-2 text-left hover:border-faint"
                    >
                      <UserCheck size={18} className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.full_name}</span>
                        <span className="block truncate text-xs text-muted">
                          {[formatPhone(c.whatsapp ?? c.phone), c.document && maskDocument(c.document)]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="text-sm font-medium text-ink">Usar</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {form.customer_id && (
        <div className="mb-5 flex items-center justify-between gap-2 rounded-card border border-positive/25 bg-positive-bg px-4 py-2.5 text-sm text-positive-ink">
          <span className="flex items-center gap-2 font-medium">
            <UserCheck size={18} /> Cliente vinculado ao cadastro
          </span>
          <button
            type="button"
            onClick={() => update("customer_id", null)}
            className="flex h-8 items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
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
          placeholder="Só números"
        />
        <TextField
          label="Telefone"
          value={form.owner_phone}
          onValueChange={(v) => update("owner_phone", formatPhone(onlyDigits(v).slice(0, 11)))}
          error={errors.owner_phone}
          inputMode="tel"
          type="tel"
          autoComplete="off"
          placeholder="DDD + número"
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
            placeholder="DDD + número"
          />
          {form.owner_phone && form.owner_phone !== form.owner_whatsapp && (
            <button
              type="button"
              onClick={() => update("owner_whatsapp", form.owner_phone)}
              className="mt-2 inline-flex h-8 items-center gap-1.5 text-sm font-medium text-ink"
            >
              <Copy size={15} /> Mesmo número do telefone
            </button>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="service-request" className="field-label">
          Serviço solicitado / queixa do cliente
        </label>
        <textarea
          id="service-request"
          value={form.service_request}
          onChange={(e) => update("service_request", e.target.value)}
          maxLength={2000}
          rows={3}
          required
          aria-describedby="service-request-hint"
          placeholder="Ex.: barulho na suspensão dianteira ao passar em lombadas; revisão dos 60 mil km"
          className="field-textarea"
        />
        <p id="service-request-hint" className="mt-1.5 text-sm text-muted">
          Obrigatório. Aparece no laudo enviado ao cliente e no PDF.
        </p>
      </div>

      <p className="mt-5 flex gap-2 text-xs leading-relaxed text-muted">
        <ShieldCheck size={15} className="shrink-0" />
        Dados pessoais usados somente para identificação do proprietário e contato sobre o serviço, conforme a LGPD
        (Lei 13.709/2018). Informe ao cliente.
      </p>
    </SectionCard>
  );
}
