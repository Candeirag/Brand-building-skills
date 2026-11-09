import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DesktopNav, MobileNav } from "@/components/shell/nav-links";
import { UserMenu } from "@/components/shell/user-menu";
import { ROLE_LABELS, requireStaff } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const isAdmin = profile.role === "admin";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-print sticky top-0 z-30 bg-ink pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Ir para o painel">
            <Logo size="sm" />
          </Link>
          <DesktopNav isAdmin={isAdmin} />
          <UserMenu name={profile.full_name} roleLabel={ROLE_LABELS[profile.role]} />
        </div>
        <div className="h-[3px] bg-gradient-to-r from-brand-red via-brand-red to-transparent" aria-hidden="true" />
      </header>
      <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10">{children}</div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
