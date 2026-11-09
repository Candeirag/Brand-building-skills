import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { CreateMemberForm, MemberRow } from "@/components/team/member-forms";
import { CustomerPrivacy } from "@/components/team/customer-privacy";
import { requireAdmin } from "@/lib/auth";
import { sanitizeSearch, onlyDigits } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Equipe" };

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { cliente } = await searchParams;

  const { data: members } = await supabase.from("profiles").select("*").order("active", { ascending: false }).order("full_name");

  let customers: { id: string; full_name: string; document: string | null; phone: string | null; whatsapp: string | null }[] = [];
  const term = sanitizeSearch(cliente);
  if (term.length >= 3) {
    const digits = onlyDigits(term);
    const filter =
      digits.length >= 8
        ? `phone.eq.${digits},whatsapp.eq.${digits},document.eq.${digits}`
        : `full_name.ilike.*${term}*`;
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, document, phone, whatsapp")
      .is("anonymized_at", null)
      .or(filter)
      .order("full_name")
      .limit(20);
    customers = data ?? [];
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:px-6 sm:py-8">
      <div>
        <h1 className="display text-3xl font-extrabold">Equipe e acessos</h1>
        <p className="text-steel">Somente funcionários cadastrados aqui acessam o sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <header className="border-b border-line px-4 py-3 sm:px-5">
            <h2 className="display text-lg font-bold">Funcionários ({members?.length ?? 0})</h2>
          </header>
          <ul className="divide-y divide-line">
            {(members ?? []).map((m) => (
              <MemberRow key={m.id} member={m} isSelf={m.id === me.id} />
            ))}
          </ul>
        </section>

        <section className="card self-start p-4 sm:p-5">
          <h2 className="display mb-4 text-lg font-bold">Cadastrar funcionário</h2>
          <CreateMemberForm />
        </section>
      </div>

      <section className="card p-4 sm:p-5">
        <h2 className="display flex items-center gap-2 text-lg font-bold">
          <ShieldCheck size={20} className="text-brand-red" /> Privacidade de clientes (LGPD)
        </h2>
        <p className="mt-1 mb-4 text-sm text-steel">
          Atenda solicitações de eliminação de dados (art. 18 da LGPD). A anonimização remove nome, documento e telefones do
          cadastro e das inspeções, mantendo apenas os dados técnicos do veículo. A operação é registrada na auditoria e não
          pode ser desfeita.
        </p>
        <CustomerPrivacy query={cliente ?? ""} customers={customers} searched={term.length >= 3} />
      </section>
    </main>
  );
}
