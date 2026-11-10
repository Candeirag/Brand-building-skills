"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { normalizePlate } from "@/lib/validation";

export function PlateSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/historico?q=${encodeURIComponent(q)}`);
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            const v = e.target.value;
            setValue(/^[a-zA-Z]{3}[-\s]?\d/.test(v) ? normalizePlate(v) : v);
          }}
          placeholder="Placa, cliente ou nº"
          aria-label="Buscar inspeções por placa, cliente ou número"
          className="field-input pl-9"
          enterKeyHint="search"
          autoCapitalize="characters"
        />
      </div>
      <button type="submit" className="h-11 rounded-control border border-control bg-surface px-3.5 text-sm font-medium hover:border-faint">
        Buscar
      </button>
    </form>
  );
}
