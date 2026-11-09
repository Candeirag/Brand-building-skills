"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, History, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; short: string; icon: LucideIcon; match: (p: string) => boolean };

const MAIN: NavItem[] = [
  { href: "/", label: "Painel", short: "Painel", icon: LayoutDashboard, match: (p) => p === "/" },
  {
    href: "/inspecoes/em-andamento",
    label: "Em andamento",
    short: "Abertas",
    icon: ClipboardList,
    match: (p) => p.startsWith("/inspecoes/em-andamento") || /^\/inspecoes\/[^/]+\/editar/.test(p),
  },
  {
    href: "/historico",
    label: "Histórico",
    short: "Histórico",
    icon: History,
    match: (p) => p.startsWith("/historico") || p.startsWith("/veiculos") || /^\/inspecoes\/[0-9a-f-]{36}$/.test(p),
  },
];
const ADMIN: NavItem = { href: "/equipe", label: "Equipe e acessos", short: "Equipe", icon: Users, match: (p) => p.startsWith("/equipe") };

export function screenName(pathname: string): string {
  if (pathname === "/") return "Painel";
  if (/^\/inspecoes\/[^/]+\/editar/.test(pathname)) return "Inspeção em andamento";
  if (pathname.startsWith("/inspecoes/em-andamento")) return "Em andamento";
  if (pathname.startsWith("/inspecoes/")) return "Inspeção";
  if (pathname.startsWith("/historico")) return "Histórico";
  if (pathname.startsWith("/veiculos")) return "Veículo";
  if (pathname.startsWith("/equipe")) return "Equipe e acessos";
  if (pathname.startsWith("/conta")) return "Minha conta";
  return "Campeças";
}

/** Barra lateral (desktop): fundo da página, pílula ativa no tom claro do vermelho. */
export function SidebarNav({ isAdmin, openCount }: { isAdmin: boolean; openCount: number }) {
  const pathname = usePathname();
  const row = (item: NavItem, count?: number) => {
    const active = item.match(pathname);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`flex h-8 items-center gap-2.5 rounded-control px-2.5 text-sm transition ${
            active ? "bg-active font-medium text-accent-ink" : "text-muted hover:bg-raised hover:text-ink"
          }`}
        >
          <Icon size={16} strokeWidth={1.75} className={active ? "text-accent" : ""} />
          <span className="flex-1">{item.label}</span>
          {count ? <span className="num text-xs font-medium text-accent-ink">{count}</span> : null}
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label="Principal" className="flex flex-1 flex-col">
      <ul className="space-y-0.5">
        {row(MAIN[0]!)}
        {row(MAIN[1]!, openCount)}
        {row(MAIN[2]!)}
      </ul>
      {isAdmin && (
        <>
          <p className="mt-7 mb-2 px-2.5 text-xs text-faint">Administração</p>
          <ul>{row(ADMIN)}</ul>
        </>
      )}
    </nav>
  );
}

/** Barra inferior (celular e tablet): quatro destinos com rótulos curtos. */
export function BottomNav({ isAdmin, openCount }: { isAdmin: boolean; openCount: number }) {
  const pathname = usePathname();
  if (/^\/inspecoes\/[^/]+\/editar/.test(pathname)) return null; // o editor usa a tela inteira
  const items = isAdmin ? [...MAIN, ADMIN] : MAIN;
  return (
    <nav
      aria-label="Principal"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          const count = item.href === "/inspecoes/em-andamento" ? openCount : 0;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                  active ? "font-medium text-accent-ink" : "text-muted"
                }`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${active ? "bg-active" : ""}`}>
                  <Icon size={20} strokeWidth={1.75} className={active ? "text-accent" : ""} />
                </span>
                {item.short}
                {count > 0 && (
                  <span className="num absolute top-1 left-[calc(50%+8px)] min-w-4 rounded-full bg-accent px-1 text-center text-[11px] leading-4 font-medium text-white">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Nome da tela na barra superior do celular. */
export function ScreenName() {
  const pathname = usePathname();
  return <span className="truncate text-base font-semibold">{screenName(pathname)}</span>;
}

/** A barra superior do celular sai no editor, que tem a própria barra com o botão de voltar. */
export function HideOnEditor({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (/^\/inspecoes\/[^/]+\/editar/.test(pathname)) return null;
  return <>{children}</>;
}
