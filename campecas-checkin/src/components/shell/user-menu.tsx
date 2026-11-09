"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

export function UserMenu({ name, roleLabel }: { name: string; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-3 text-left text-white/80 hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="hidden text-right leading-tight sm:block">
          <span className="block text-sm font-semibold text-white">{name}</span>
          <span className="block text-[11px] text-white/50">{roleLabel}</span>
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-graphite-2 text-sm font-bold text-white ring-2 ring-brand-red/70">
          {initials || "?"}
        </span>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-40 mt-2 w-60 overflow-hidden p-1.5 text-ink shadow-xl">
          <div className="px-3 py-2.5 sm:hidden">
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-steel">{roleLabel}</p>
          </div>
          <Link
            href="/privacidade"
            role="menuitem"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-paper"
            onClick={() => setOpen(false)}
          >
            <ShieldCheck size={18} className="text-steel" /> Privacidade e LGPD
          </Link>
          <form action="/auth/sair" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-red hover:bg-brand-red-soft"
            >
              <LogOut size={18} /> Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
