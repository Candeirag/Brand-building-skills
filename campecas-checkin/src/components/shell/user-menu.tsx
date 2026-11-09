"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronsUpDown, LogOut, ShieldCheck } from "lucide-react";

// Sombra só no que flutua (menu aberto sobre o conteúdo).
const MENU_SHADOW = "shadow-[0_8px_24px_rgba(0,0,0,0.12)]"; // taste-skill-ignore: sobreposição real

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Linha do usuário (pé da barra lateral) ou avatar (barra superior do celular). */
export function UserMenu({ name, roleLabel, compact = false }: { name: string; roleLabel: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatar = (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-tint text-xs font-semibold text-accent-ink">
      {initials(name) || "?"}
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-11 items-center justify-center"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Conta de ${name}`}
        >
          {avatar}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-control p-1.5 text-left hover:bg-raised"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {avatar}
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted">{roleLabel}</span>
          </span>
          <ChevronsUpDown size={14} className="text-faint" />
        </button>
      )}
      {open && (
        <div
          role="menu"
          className={`absolute z-40 w-60 rounded-card border border-border bg-surface p-1 ${MENU_SHADOW} ${
            compact ? "top-12 right-0" : "bottom-12 left-0"
          }`}
        >
          {compact && (
            <div className="border-b border-rule px-3 py-2.5">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
          )}
          <Link
            href="/privacidade"
            role="menuitem"
            className="flex h-10 items-center gap-2.5 rounded-control px-3 text-sm hover:bg-raised"
            onClick={() => setOpen(false)}
          >
            <ShieldCheck size={16} className="text-muted" /> Privacidade e LGPD
          </Link>
          <form action="/auth/sair" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex h-10 w-full items-center gap-2.5 rounded-control px-3 text-sm text-accent-ink hover:bg-tint"
            >
              <LogOut size={16} /> Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
