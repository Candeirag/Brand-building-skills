"use client";

import { useSyncExternalStore } from "react";
import { Timer } from "lucide-react";
import { formatDuration } from "@/lib/time";
import { isOverdue, yardDurationMs } from "@/lib/yard";

/** Relógio compartilhado: um único intervalo de 30 s para todos os temporizadores da tela. */
const listeners = new Set<() => void>();
let tick = 0;
let interval: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  tick = Date.now();
  interval ??= setInterval(() => {
    tick = Date.now();
    listeners.forEach((l) => l());
  }, 30_000);
  onChange();
  return () => {
    listeners.delete(onChange);
    if (!listeners.size && interval) {
      clearInterval(interval);
      interval = null;
    }
  };
}

const noop = () => () => {};

/** Hora atual que avança a cada 30 s; no servidor e na hidratação usa a hora enviada pelo servidor. */
function useNow(serverNow: number, live: boolean): number {
  const now = useSyncExternalStore(
    live ? subscribe : noop,
    () => (live && tick ? tick : serverNow),
    () => serverNow,
  );
  return now;
}

/**
 * Tempo no pátio. Corre ao vivo enquanto não há saída registrada; parado depois dela.
 * nowMs vem do servidor para o primeiro desenho bater com a hidratação.
 */
export function YardTimer({
  startedAt,
  exitedAt,
  nowMs,
  variant = "chip",
  className = "",
}: {
  startedAt: string;
  exitedAt: string | null;
  nowMs: number;
  variant?: "chip" | "text" | "large";
  className?: string;
}) {
  const now = useNow(nowMs, !exitedAt);
  const ms = yardDurationMs(startedAt, exitedAt, now);
  const overdue = !exitedAt && isOverdue(ms);
  const label = formatDuration(ms);

  if (variant === "large") {
    return (
      <span className={`num text-2xl leading-8 font-medium ${overdue ? "text-warning-ink" : "text-ink"}`}>{label}</span>
    );
  }
  if (variant === "text") {
    return <span className={overdue ? "font-medium text-warning-ink" : undefined}>{label}</span>;
  }
  return (
    <span
      title={exitedAt ? "Tempo que o carro ficou no pátio" : "Tempo no pátio (desde a entrada)"}
      className={`num items-center gap-1 rounded-chip ${className || "inline-flex"} px-1.5 py-0.5 text-xs whitespace-nowrap ${
        exitedAt
          ? "bg-raised text-muted"
          : overdue
            ? "border border-warning-border bg-warning-bg font-medium text-warning-ink"
            : "bg-raised text-ink"
      }`}
    >
      <Timer size={12} aria-hidden="true" className={exitedAt ? "" : "text-muted"} />
      <span className="sr-only">{exitedAt ? "Ficou no pátio por" : "No pátio há"} </span>
      {label}
    </span>
  );
}
