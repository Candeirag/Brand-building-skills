import type { Enums } from "@/lib/supabase/database.types";

/** Uma marca de status por linha: tom claro com texto escuro do mesmo matiz. */
export function StatusBadge({ status }: { status: Enums<"inspection_status"> }) {
  if (status === "finalized") {
    return (
      <span className="inline-flex h-5 flex-none items-center rounded-chip bg-raised px-1.5 text-xs font-medium whitespace-nowrap text-muted">
        Finalizada
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 flex-none items-center rounded-chip border border-warning-border bg-warning-bg px-1.5 text-xs font-medium whitespace-nowrap text-warning-ink">
      Em andamento
    </span>
  );
}

/** Contagem de avarias: o vermelho só quando há avaria; zero aparece como zero. */
export function DamageCount({ count }: { count: number }) {
  if (count === 0) return <span className="num text-sm text-muted">0</span>;
  return (
    <span className="num inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      {count}
    </span>
  );
}
