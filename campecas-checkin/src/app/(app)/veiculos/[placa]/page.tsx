import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewInspectionButton } from "@/components/inspection/new-inspection-button";
import { InspectionRow, InspectionTableHeader } from "@/components/inspection/inspection-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Plate } from "@/components/ui/plate";
import { requireStaff } from "@/lib/auth";
import { formatDate, formatNumber, formatPhone, formatPlate } from "@/lib/format";
import { INSPECTION_ROW_SELECT, toRowData } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidPlate, normalizePlate } from "@/lib/validation";

export async function generateMetadata({ params }: { params: Promise<{ placa: string }> }): Promise<Metadata> {
  const { placa } = await params;
  return { title: `Veículo ${formatPlate(placa)}` };
}

/* Pergunta da tela: "Como este carro já entrou na oficina antes?": a lista de entradas, com km e avarias. */
export default async function VehiclePage({ params }: { params: Promise<{ placa: string }> }) {
  await requireStaff();
  const plate = normalizePlate(decodeURIComponent((await params).placa));
  if (!isValidPlate(plate)) notFound();
  const now = new Date();

  const supabase = await createClient();
  const [vehicleRes, inspectionsRes] = await Promise.all([
    supabase.from("vehicles").select("*, customers(full_name, phone, whatsapp, anonymized_at)").eq("plate", plate).maybeSingle(),
    supabase.from("inspections").select(INSPECTION_ROW_SELECT).eq("plate", plate).order("started_at", { ascending: false }).limit(100),
  ]);

  const vehicle = vehicleRes.data;
  const rows = (inspectionsRes.data ?? []).map(toRowData);
  if (!vehicle && rows.length === 0) notFound();
  const owner = vehicle?.customers && !vehicle.customers.anonymized_at ? vehicle.customers : null;
  const finalized = rows.filter((r) => r.status === "finalized");
  const last = finalized[0];

  const kpis = [
    { label: "Última quilometragem", value: vehicle?.last_mileage != null ? formatNumber(vehicle.last_mileage) : "–", unit: vehicle?.last_mileage != null ? "km" : "" },
    { label: "Entradas finalizadas", value: String(finalized.length), unit: "" },
    { label: "Avarias na última", value: last ? String(last.damages) : "–", unit: last ? formatDate(last.finalized_at) : "", alert: (last?.damages ?? 0) > 0 },
  ];

  return (
    <main className="mx-auto max-w-[1280px] px-4 pt-5 lg:px-8 lg:pt-8">
      <nav aria-label="Caminho" className="text-sm text-muted">
        <Link href="/historico" className="hover:text-ink">
          Histórico
        </Link>
        {" / Veículo"}
      </nav>
      <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Plate value={plate} size="lg" />
          <div className="min-w-0">
            <h1 className="h1 truncate">{[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || formatPlate(plate)}</h1>
            <p className="truncate text-[15px] text-muted">
              {[vehicle?.year, vehicle?.color].filter(Boolean).join(" · ")}
              {owner && (
                <>
                  {vehicle?.year || vehicle?.color ? " · " : ""}
                  {owner.full_name}
                  {(owner.whatsapp || owner.phone) && ` · ${formatPhone(owner.whatsapp ?? owner.phone)}`}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex-none">
          <NewInspectionButton plate={plate} label="Nova inspeção deste veículo" />
        </div>
      </div>

      <section aria-label="Resumo do veículo" className="panel mt-6 grid grid-cols-1 sm:grid-cols-3">
        {kpis.map((k, idx) => (
          <div key={k.label} className={`px-4 py-3.5 md:px-5 ${idx ? "border-t border-border sm:border-t-0 sm:border-l" : ""}`}>
            <p className="text-sm text-muted">{k.label}</p>
            <p className={`num mt-1 text-2xl leading-8 font-medium ${k.alert ? "text-accent-ink" : ""}`}>
              {k.value} {k.unit && <span className="text-sm font-normal text-muted">{k.unit}</span>}
            </p>
          </div>
        ))}
      </section>

      <section className="panel mt-6 overflow-hidden">
        <header className="flex items-baseline justify-between px-4 py-3.5">
          <h2 className="h2">Entradas na oficina</h2>
          <span className="num text-sm text-muted">{rows.length}</span>
        </header>
        {rows.length ? (
          <>
            <InspectionTableHeader />
            <ul className="border-t border-rule">
              {rows.map((item) => (
                <InspectionRow key={item.id} item={item} now={now} />
              ))}
            </ul>
          </>
        ) : (
          <EmptyState title="Nenhuma inspeção registrada para esta placa." />
        )}
      </section>
    </main>
  );
}
