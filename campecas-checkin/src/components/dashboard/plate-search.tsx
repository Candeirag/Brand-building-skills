"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { normalizePlate } from "@/lib/validation";

export function PlateSearch() {
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
      className="relative"
    >
      <Search size={22} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-steel" />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          // Se parecer placa, normaliza em maiúsculas.
          setValue(/^[a-zA-Z]{3}[-\s]?\d/.test(v) ? normalizePlate(v) : v);
        }}
        placeholder="Placa, cliente ou nº"
        aria-label="Buscar inspeções"
        className="field-input h-14 pr-28 pl-12 text-lg"
        enterKeyHint="search"
        autoCapitalize="characters"
      />
      <button
        type="submit"
        className="absolute top-1.5 right-1.5 bottom-1.5 rounded-lg bg-ink px-4 text-sm font-semibold text-white"
      >
        Buscar
      </button>
    </form>
  );
}
