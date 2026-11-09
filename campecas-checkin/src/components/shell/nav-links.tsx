"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, History, LayoutDashboard, Users } from "lucide-react";

const LINKS = [
  { href: "/", label: "Painel", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/historico", label: "Histórico", icon: History, match: (p: string) => p.startsWith("/historico") || p.startsWith("/veiculos") },
  { href: "/inspecoes/em-andamento", label: "Rascunhos", icon: ClipboardList, match: (p: string) => p.startsWith("/inspecoes/em-andamento") },
];
const ADMIN_LINK = { href: "/equipe", label: "Equipe", icon: Users, match: (p: string) => p.startsWith("/equipe") };

export function DesktopNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
      {links.map(({ href, label, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              active ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  if (/^\/inspecoes\/[^/]+\/editar/.test(pathname)) return null; // tela cheia durante a inspeção
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;
  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Principal"
    >
      <ul className="flex">
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  active ? "text-white" : "text-white/50"
                }`}
              >
                <Icon size={22} className={active ? "text-brand-red" : ""} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
