import type { Enums } from "@/lib/supabase/database.types";

export function StatusBadge({ status }: { status: Enums<"inspection_status"> }) {
  if (status === "finalized") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Finalizada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warn" />
      Em andamento
    </span>
  );
}
