import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DamageCount, StatusBadge } from "@/components/ui/status-badge";
import { Plate } from "@/components/ui/plate";
import { formatDate, formatNumber, formatTime, isoDateInSaoPaulo } from "@/lib/format";
import type { InspectionRowData } from "@/lib/queries";
import { elapsed } from "@/lib/time";

/*
 * Tabela de inspeções: fios e alinhamento, sem zebra e sem faixa no cabeçalho.
 * Desktop (>= 768): placa 108 | veículo/proprietário 1fr | km 84 | avarias 64 | horário 80 | ação 96.
 * Celular: linha de duas linhas (identidade e avarias na 1ª; o resto em cinza na 2ª).
 */
const COLS = "md:grid md:grid-cols-[108px_minmax(0,1fr)_84px_64px_80px_96px] md:items-center md:gap-4";

export function InspectionTableHeader() {
  return (
    <div className={`hidden h-9 px-4 text-xs text-muted ${COLS}`}>
      <span>Placa</span>
      <span>Veículo e proprietário</span>
      <span className="text-right">Km</span>
      <span className="text-right">Avarias</span>
      <span className="text-right">Horário</span>
      <span />
    </div>
  );
}

export function InspectionRow({ item, now }: { item: InspectionRowData; now: Date }) {
  const draft = item.status === "draft";
  const href = draft ? `/inspecoes/${item.id}/editar` : `/inspecoes/${item.id}`;
  const vehicle = [item.brand, item.model].filter(Boolean).join(" ") || "Veículo não informado";
  const when = item.finalized_at ?? item.started_at;
  const today = isoDateInSaoPaulo(new Date(when)) === isoDateInSaoPaulo(now);
  const secondary = draft
    ? `${item.inspector_name ?? "–"} · aberta ${elapsed(item.started_at, now)}`
    : `${item.owner_name ?? "Proprietário não informado"} · ${item.number}${
        item.lastSentAt ? ` · laudo enviado em ${formatDate(item.lastSentAt)} às ${formatTime(item.lastSentAt)}` : ""
      }`;

  return (
    <li className="border-t border-rule first:border-t-0">
      <Link href={href} className={`flex items-center gap-3 px-4 py-3 transition hover:bg-raised md:py-0 ${COLS} md:h-16`}>
        <Plate value={item.plate} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{vehicle}</p>
          <p className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
            {draft && <StatusBadge status="draft" />}
            <span className="truncate">
            {secondary}
            <span className="md:hidden">
              {item.mileage != null && ` · ${formatNumber(item.mileage)} km`} · {today ? formatTime(when) : formatDate(when)}
            </span>
            </span>
          </p>
        </div>

        <span className="num hidden text-right text-sm md:block">
          {item.mileage != null ? (
            <>
              {formatNumber(item.mileage)} <span className="text-muted">km</span>
            </>
          ) : (
            <span className="text-muted">–</span>
          )}
        </span>

        <span className="flex flex-none flex-col items-end md:block md:text-right">
          <DamageCount count={item.damages} />
          <span className="text-[11px] text-muted md:hidden">{item.damages === 1 ? "avaria" : "avarias"}</span>
        </span>

        <span className="num hidden text-right text-sm md:block">
          {today ? formatTime(when) : formatDate(when)}
          {!today && <span className="block text-xs text-muted">{formatTime(when)}</span>}
        </span>

        <span className="hidden items-center justify-end gap-1 text-sm font-medium md:flex">
          {draft ? (
            <span className="text-ink">Continuar</span>
          ) : (
            <span className="text-muted">Abrir</span>
          )}
          <ChevronRight size={16} className="text-faint" />
        </span>
        <ChevronRight size={18} className="flex-none text-faint md:hidden" />
      </Link>
    </li>
  );
}
