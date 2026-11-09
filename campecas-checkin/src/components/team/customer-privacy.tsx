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
        <input name="cliente" defaultValue={query} placeholder="Nome, telefone ou CPF/CNPJ" className="field-input h-12 flex-1" />
        <button type="submit" className={buttonClass("dark", "md", "h-12")}>
          <Search size={18} /> Buscar
        </button>
      </form>
      {message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-ok-soft text-ok" : "bg-brand-red-soft text-brand-red-dark"}`}>
          {message.text}
        </p>
      )}
      {searched &&
        (customers.length ? (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.full_name}</p>
                  <p className="truncate text-xs text-steel">
                    {[formatPhone(c.whatsapp ?? c.phone), c.document && maskDocument(c.document)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button type="button" disabled={pending} onClick={() => anonymize(c)} className={buttonClass("danger", "sm")}>
                  {busyId === c.id ? <LoaderCircle size={14} className="animate-spin" /> : <Eraser size={14} />} Anonimizar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-steel">Nenhum cliente encontrado.</p>
        ))}
    </div>
  );
}
