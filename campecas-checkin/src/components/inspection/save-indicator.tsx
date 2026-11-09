"use client";

import { AlertCircle, Check, CloudOff, LoaderCircle } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { SaveState } from "./types";

export function SaveIndicator({ state }: { state: SaveState }) {
  const base = "inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap";
  switch (state.kind) {
    case "saving":
      return (
        <span className={`${base} text-white/70`} aria-live="polite">
          <LoaderCircle size={14} className="animate-spin" /> Salvando…
        </span>
      );
    case "saved":
      return (
        <span className={`${base} text-emerald-400`} aria-live="polite">
          <Check size={14} strokeWidth={3} /> Salvo {formatTime(state.at)}
        </span>
      );
    case "offline":
      return (
        <span className={`${base} text-amber-300`} aria-live="polite">
          <CloudOff size={14} /> Sem internet · salvo no aparelho
        </span>
      );
    case "error":
      return (
        <span className={`${base} max-w-48 truncate text-red-300`} title={state.message} aria-live="polite">
          <AlertCircle size={14} /> {state.message}
        </span>
      );
    default:
      return <span className={`${base} text-white/50`}>Rascunho salvo automaticamente</span>;
  }
}
