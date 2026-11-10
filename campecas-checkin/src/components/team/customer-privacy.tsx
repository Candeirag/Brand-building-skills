"use client";

import { useState, useTransition } from "react";
import { Eraser, LoaderCircle, Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { anonymizeCustomer } from "@/app/(app)/equipe/actions";
import { formatPhone, maskDocument } from "@/lib/format";

type Customer = { id: string; full_name: string; document: string | null; phone: string | null; whatsapp: string | null };

export function CustomerPrivacy({ query, customers, searched }: { query: string; customers: Customer[]; searched: boolean }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const anonymize = (c: Customer) => {
    const ok = window.confirm(
      `Anonimizar os dados de "${c.full_name}"?\n\nNome, documento e telefones serão removidos do cadastro e de todas as inspeções. Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setBusyId(c.id);
    start(async () => {
      const res = await anonymizeCustomer(c.id);
      setBusyId(null);
      setMessage(res.error ? { ok: false, text: res.error } : { ok: true, text: res.message ?? "Concluído." });
    });
  };

  return (
    <div className="space-y-3">
      <form method="get" className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input name="cliente" defaultValue={query} placeholder="Nome, telefone ou CPF/CNPJ" aria-label="Buscar cliente" className="field-input pl-9" />
        </div>
        <button type="submit" className={buttonClass("outline", "lg")}>
          Buscar
        </button>
      </form>
      {message && (
        <p
          className={`rounded-control border px-3 py-2 text-sm ${
            message.ok ? "border-positive/25 bg-positive-bg text-positive-ink" : "border-tint-2 bg-tint text-accent-ink"
          }`}
        >
          {message.text}
        </p>
      )}
      {searched &&
        (customers.length ? (
          <ul className="rounded-card border border-border">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center gap-3 border-t border-rule px-4 py-2.5 first:border-t-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.full_name}</p>
                  <p className="truncate text-[13px] text-muted">
                    {[formatPhone(c.whatsapp ?? c.phone), c.document && maskDocument(c.document)].filter(Boolean).join(" · ") || "Sem contato"}
                  </p>
                </div>
                <button type="button" disabled={pending} onClick={() => anonymize(c)} className={buttonClass("danger", "md")}>
                  {busyId === c.id ? <LoaderCircle size={14} className="animate-spin" /> : <Eraser size={14} />} Anonimizar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card border border-dashed border-control px-4 py-3 text-sm text-muted">
            Nenhum cliente encontrado para “{query}”.
          </p>
        ))}
    </div>
  );
}
