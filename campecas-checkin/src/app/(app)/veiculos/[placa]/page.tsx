import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Gauge, Plus } from "lucide-react";
import { createInspection } from "../../inspecoes/actions";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plate } from "@/components/ui/plate";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireStaff } from "@/lib/auth";
import { formatDateTime, formatKm, formatPhone, formatPlate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { isValidPlate, normalizePlate } from "@/lib/validation";

export async function generateMetadata({ params }: { params: Promise<{ placa: string }> }): Promise<Metadata> {
  const { placa } = await params;
  return { title: `Veículo ${formatPlate(placa)}` };
}

export default async function VehiclePage({ params }: { params: Promise<{ placa: string }> }) {
  await requireStaff();
  const plate = normalizePlate(decodeURIComponent((await params).placa));
  if (!isValidPlate(plate)) notFound();

  const supabase = await createClient();
  const [vehicleRes, inspectionsRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*, customers(full_name, phone, whatsapp, anonymized_at)")
      .eq("plate", plate)
      .maybeSingle(),
    supabase
      .from("inspections")
      .select("id, number, status, mileage, owner_name, started_at, finalized_at, inspector_name, inspection_items(status)")
      .eq("plate", plate)
      .order("started_at", { ascending: false })
      .limit(100),
  ]);

  const vehicle = vehicleRes.data;
  const inspections = inspectionsRes.data ?? [];
  if (!vehicle && inspections.length === 0) notFound();
  const owner = vehicle?.customers && !vehicle.customers.anonymized_at ? vehicle.customers : null;

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
      <Link href="/historico" className="inline-flex items-center gap-1.5 text-sm font-semibold text-steel hover:text-ink">
        <ArrowLeft size={16} /> Histórico
      </Link>

      <header className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Plate value={plate} size="lg" />
          <div>
            <p className="display text-2xl font-bold">
              {[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "Veículo"}
            </p>
            <p className="text-sm text-steel">
              {[vehicle?.year, vehicle?.color].filter(Boolean).join(" · ")}
              {vehicle?.last_mileage != null && (
                <>
                  {" "}
                  · <Gauge size={14} className="inline" /> {formatKm(vehicle.last_mileage)}
                </>
              )}
            </p>
            {owner && (
              <p className="mt-1 text-sm">
                <span className="font-semibold">{owner.full_name}</span>
                {(owner.whatsapp || owner.phone) && (
                  <span className="text-steel"> · {formatPhone(owner.whatsapp ?? owner.phone)}</span>
                )}
              </p>
            )}
          </div>
        </div>
        <form action={createInspection}>
          <input type="hidden" name="plate" value={plate} />
          <button type="submit" className={buttonClass("primary", "lg", "w-full")}>
            <Plus size={20} /> Nova inspeção deste veículo
          </button>
        </form>
      </header>

      <section className="card overflow-hidden">
        <header className="border-b border-line px-4 py-3 sm:px-5">
          <h2 className="display text-lg font-bold">Inspeções anteriores ({inspections.length})</h2>
        </header>
        {inspections.length ? (
          <ol className="relative divide-y divide-line">
            {inspections.map((ins) => {
              const damages = (ins.inspection_items ?? []).filter((it) => it.status === "damaged").length;
              const href = ins.status === "draft" ? `/inspecoes/${ins.id}/editar` : `/inspecoes/${ins.id}`;
              return (
                <li key={ins.id}>
                  <Link href={href} className="flex items-center gap-4 px-4 py-4 hover:bg-paper sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        <span className="font-mono">{ins.number ?? "Rascunho"}</span>
                        <span className="ml-2 font-normal text-steel">
                          {formatDateTime(ins.finalized_at ?? ins.started_at)}
                        </span>
                      </p>
                      <p className="text-sm text-steel">
                        {formatKm(ins.mileage)} · {ins.owner_name ?? "—"} · {ins.inspector_name ?? "—"}
                      </p>
                      {damages > 0 && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-red">
                          <AlertTriangle size={13} /> {damages} avaria(s)
                        </p>
                      )}
                    </div>
                    <StatusBadge status={ins.status} />
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState title="Nenhuma inspeção registrada" />
        )}
      </section>
    </main>
  );
}
