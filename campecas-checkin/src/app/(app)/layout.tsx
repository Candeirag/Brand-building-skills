import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/logo";
import { BottomNav, HideOnEditor, ScreenName, SidebarNav } from "@/components/shell/nav-links";
import { UserMenu } from "@/components/shell/user-menu";
import { ROLE_LABELS, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/*
 * Estrutura "plano aberto": barra lateral de 240 px sobre o fundo da página, separada por um fio de 1 px;
 * sem barra superior no desktop. Abaixo de 1024 px: barra superior de 48 px (símbolo, nome da tela, conta)
 * e barra inferior com os destinos.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();
  const { count } = await supabase
    .from("inspections")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft");
  const openCount = count ?? 0;
  const roleLabel = ROLE_LABELS[profile.role];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="no-print sticky top-0 hidden h-dvh flex-col border-r border-border px-3 pt-5 pb-3 lg:flex">
        <Link href="/" className="mb-6 px-1.5" aria-label="Ir para o painel">
          <Logo size="sm" subtitle="Oficina · Check-in" />
        </Link>
        <SidebarNav isAdmin={isAdmin} openCount={openCount} />
        <UserMenu name={profile.full_name} roleLabel={roleLabel} />
      </aside>

      <HideOnEditor>
      <header className="no-print sticky top-0 z-30 border-b border-border bg-ground pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="flex h-12 items-center gap-3 pr-1 pl-4">
          <Link href="/" aria-label="Ir para o painel">
            <LogoMark className="h-7 w-7" />
          </Link>
          <div className="min-w-0 flex-1">
            <ScreenName />
          </div>
          <UserMenu name={profile.full_name} roleLabel={roleLabel} compact />
        </div>
      </header>
      </HideOnEditor>

      <div className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-12">{children}</div>
      <BottomNav isAdmin={isAdmin} openCount={openCount} />
    </div>
  );
}
