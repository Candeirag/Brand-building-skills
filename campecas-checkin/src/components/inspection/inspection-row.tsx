import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Plate } from "@/components/ui/plate";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatKm } from "@/lib/format";
import type { InspectionListItem } from "@/lib/queries";

export function InspectionRow({ item }: { item: InspectionListItem }) {
  const href = item.status === "draft" ? `/inspecoes/${item.id}/editar` : `/inspecoes/${item.id}`;
  const vehicle = [item.brand, item.model].filter(Boolean).join(" ") || "Veículo não informado";
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-paper sm:gap-4 sm:px-5">
        <Plate value={item.plate} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{vehicle}</p>
          <p className="truncate text-sm text-steel">
            {item.owner_name || "Proprietário não informado"}
            {item.mileage != null && <> · {formatKm(item.mileage)}</>}
          </p>
          <p className="mt-0.5 truncate text-xs text-steel/80">
            {item.status === "finalized" ? (
              <>
                <span className="font-mono font-semibold text-graphite">{item.number}</span> ·{" "}
                {formatDateTime(item.finalized_at)}
              </>
            ) : (
              <>Iniciada {formatDateTime(item.started_at)} · {item.inspector_name}</>
            )}
          </p>
        </div>
        <div className="hidden sm:block">
          <StatusBadge status={item.status} />
        </div>
        <ChevronRight size={20} className="shrink-0 text-steel/60" />
      </Link>
    </li>
  );
}
