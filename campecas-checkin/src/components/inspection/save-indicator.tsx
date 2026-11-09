"use client";

import { AlertCircle, Check, CloudOff, LoaderCircle } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { SaveState } from "./types";

/** Carimbo discreto do salvamento automático. */
export function SaveIndicator({ state }: { state: SaveState }) {
  const base = "inline-flex items-center gap-1.5 text-xs whitespace-nowrap";
  switch (state.kind) {
    case "saving":
      return (
        <span className={`${base} text-muted`} aria-live="polite">
          <LoaderCircle size={13} className="animate-spin" /> Salvando…
        </span>
      );
    case "saved":
      return (
        <span className={`${base} text-muted`} aria-live="polite">
          <Check size={13} strokeWidth={2.5} className="text-positive" /> Salvo às <span className="num">{formatTime(state.at)}</span>
        </span>
      );
    case "offline":
      return (
        <span className={`${base} rounded-chip border border-warning-border bg-warning-bg px-1.5 py-0.5 text-warning-ink`} aria-live="polite">
          <CloudOff size={13} /> Sem internet · salvo no aparelho
        </span>
      );
    case "error":
      return (
        <span className={`${base} max-w-56 truncate text-accent-ink`} title={state.message} aria-live="polite">
          <AlertCircle size={13} /> {state.message}
        </span>
      );
    default:
      return <span className={`${base} text-muted`}>Salvamento automático</span>;
  }
}
