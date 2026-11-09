import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { ROLE_LABELS, requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Minha conta" };

/* Pergunta da tela: "Como troco a minha senha?" (primeiro acesso com senha provisória). */
export default async function AccountPage() {
  const profile = await requireStaff();
  return (
    <main className="mx-auto max-w-[1280px] px-4 pt-5 lg:px-8 lg:pt-8">
      {profile.must_change_password && (
        <div role="status" className="mb-5 rounded-card border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-ink">
          <strong className="font-medium">Defina a sua senha para continuar.</strong> Você entrou com uma senha provisória
          criada pelo administrador. Depois de trocar, o sistema abre normalmente.
        </div>
      )}
      <h1 className="h1">Minha conta</h1>
      <p className="mt-1 mb-8 text-[15px] text-muted">
        {profile.full_name} · {ROLE_LABELS[profile.role]} · {profile.email}
      </p>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        <div>
          <h2 className="h2">Alterar senha</h2>
          <p className="mt-1 text-sm text-muted">
            Troque a senha provisória no primeiro acesso. Use pelo menos 8 caracteres, com letra maiúscula, minúscula e
            número.
          </p>
        </div>
        <div className="panel max-w-xl p-4 sm:p-5">
          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}
