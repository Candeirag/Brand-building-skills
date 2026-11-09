import type { Metadata } from "next";
import { CreateMemberForm, MemberRow } from "@/components/team/member-forms";
import { CustomerPrivacy } from "@/components/team/customer-privacy";
import { requireAdmin } from "@/lib/auth";
import { onlyDigits, sanitizeSearch } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Equipe e acessos" };

/*
 * Configurações em linhas: coluna de rótulo (título 16/500 + descrição) ao lado do painel.
 * Desktop: 320 px + 1fr, vão de 32 px; seções separadas por fio de 1 px. Celular: empilha.
 */
function SettingsRow({ title, description, children }: { title: string; description: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-border py-8 first:border-t-0 first:pt-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
      <div>
        <h2 className="h2">{title}</h2>
        <div className="mt-1 text-sm text-muted">{description}</div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { cliente } = await searchParams;

  const { data: members } = await supabase.from("profiles").select("*").order("active", { ascending: false }).order("full_name");
  const active = (members ?? []).filter((m) => m.active).length;

  let customers: { id: string; full_name: string; document: string | null; phone: string | null; whatsapp: string | null }[] = [];
  const term = sanitizeSearch(cliente);
  if (term.length >= 3) {
    const digits = onlyDigits(term);
    const filter = digits.length >= 8 ? `phone.eq.${digits},whatsapp.eq.${digits},document.eq.${digits}` : `full_name.ilike.*${term}*`;
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
    <main className="mx-auto max-w-[1280px] px-4 pt-5 lg:px-8 lg:pt-8">
      <h1 className="h1">Equipe e acessos</h1>
      <p className="mt-1 mb-8 text-[15px] text-muted">
        {plural(active, "funcionário", "funcionários")} com acesso. Só quem está cadastrado aqui entra no sistema.
      </p>

      <SettingsRow
        title="Funcionários"
        description="Função define o que cada um pode fazer. Desativar bloqueia o login na hora e mantém o histórico das inspeções."
      >
        <ul className="panel">
          {(members ?? []).map((m) => (
            <MemberRow key={m.id} member={m} isSelf={m.id === me.id} />
          ))}
        </ul>
      </SettingsRow>

      <SettingsRow
        title="Cadastrar funcionário"
        description="Crie o acesso com uma senha provisória e informe-a pessoalmente. Mecânicos aparecem como opção de mecânico responsável."
      >
        <div className="panel max-w-xl p-4 sm:p-5">
          <CreateMemberForm />
        </div>
      </SettingsRow>

      <SettingsRow
        title="Privacidade de clientes (LGPD)"
        description={
          <>
            Atende pedidos de eliminação de dados (art. 18). Remove nome, documento e telefones do cadastro e de todas as
            inspeções, mantendo só os dados técnicos do veículo. Fica registrado na auditoria e{" "}
            <strong className="font-medium text-ink">não pode ser desfeito</strong>.
          </>
        }
      >
        <div className="panel p-4 sm:p-5">
          <CustomerPrivacy query={cliente ?? ""} customers={customers} searched={term.length >= 3} />
        </div>
      </SettingsRow>
    </main>
  );
}
