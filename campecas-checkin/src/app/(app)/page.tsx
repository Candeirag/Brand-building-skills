import Link from "next/link";
import { CarFront, CheckCircle2, ClipboardList, Clock3, Plus } from "lucide-react";
import { createInspection } from "./inspecoes/actions";
import { PlateSearch } from "@/components/dashboard/plate-search";
import { InspectionRow } from "@/components/inspection/inspection-row";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plate } from "@/components/ui/plate";
import { requireStaff } from "@/lib/auth";
import { formatDate, formatKm, isoDateInSaoPaulo, startOfDaySaoPaulo } from "@/lib/format";
import { INSPECTION_LIST_COLUMNS, type InspectionListItem } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await requireStaff();
  const supabase = await createClient();
  const todayStart = startOfDaySaoPaulo(isoDateInSaoPaulo());

  const [today, drafts, finalized, recent, inProgress, vehicles] = await Promise.all([
    supabase.from("inspections").select("id", { count: "exact", head: true }).gte("started_at", todayStart),
    supabase.from("inspections").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("inspections").select("id", { count: "exact", head: true }).eq("status", "finalized"),
    supabase
      .from("inspections")
      .select(INSPECTION_LIST_COLUMNS)
      .eq("status", "finalized")
      .order("finalized_at", { ascending: false })
      .limit(8),
    supabase
      .from("inspections")
      .select(INSPECTION_LIST_COLUMNS)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("vehicles")
      .select("id, plate, brand, model, last_mileage, updated_at")
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const firstName = profile.full_name.split(" ")[0];
  const stats = [
    { label: "Realizadas hoje", value: today.count ?? 0, icon: Clock3, href: "/historico?periodo=hoje" },
    { label: "Em andamento", value: drafts.count ?? 0, icon: ClipboardList, href: "/inspecoes/em-andamento" },
    { label: "Finalizadas", value: finalized.count ?? 0, icon: CheckCircle2, href: "/historico?status=finalized" },
  ];

  return (
    <main>
      {/* Faixa de destaque */}
      <section className="relative overflow-hidden bg-ink pb-24 text-white">
        <div className="racing-stripe absolute top-0 right-0 h-full w-40 opacity-20 sm:w-72" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
          <p className="text-white/60">Olá, {firstName}</p>
          <h1 className="display mt-1 text-3xl font-extrabold sm:text-4xl">Inspeção de entrada</h1>
          <form action={createInspection} className="mt-6 sm:max-w-md">
            <button type="submit" className={buttonClass("primary", "xl", "w-full shadow-lg shadow-brand-red/30")}>
              <Plus size={26} strokeWidth={2.5} />
              Nova inspeção
            </button>
          </form>
        </div>
      </section>

      <div className="relative mx-auto -mt-16 max-w-6xl space-y-6 px-4 sm:px-6">
        <div className="card p-3 sm:p-4">
          <PlateSearch />
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href} className="card group p-3.5 transition hover:border-graphite/30 sm:p-5">
              <Icon size={20} className="text-brand-red" />
              <p className="display mt-2 text-3xl font-extrabold sm:text-4xl">{value}</p>
              <p className="text-xs leading-tight font-medium text-steel sm:text-sm">{label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {(inProgress.data?.length ?? 0) > 0 && (
              <section className="card overflow-hidden">
                <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
                  <h2 className="display text-lg font-bold">Em andamento</h2>
                  <Link href="/inspecoes/em-andamento" className="text-sm font-semibold text-brand-red">
                    Ver todas
                  </Link>
                </header>
                <ul className="divide-y divide-line">
                  {(inProgress.data as InspectionListItem[]).map((item) => (
                    <InspectionRow key={item.id} item={item} />
                  ))}
                </ul>
              </section>
            )}

            <section className="card overflow-hidden">
              <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
                <h2 className="display text-lg font-bold">Últimas inspeções</h2>
                <Link href="/historico" className="text-sm font-semibold text-brand-red">
                  Histórico completo
                </Link>
              </header>
              {recent.data?.length ? (
                <ul className="divide-y divide-line">
                  {(recent.data as InspectionListItem[]).map((item) => (
                    <InspectionRow key={item.id} item={item} />
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<ClipboardList size={36} />} title="Nenhuma inspeção finalizada ainda">
                  Toque em <strong>Nova inspeção</strong> para registrar o primeiro veículo.
                </EmptyState>
              )}
            </section>
          </div>

          <section className="card self-start overflow-hidden">
            <header className="border-b border-line px-4 py-3 sm:px-5">
              <h2 className="display text-lg font-bold">Histórico de veículos</h2>
            </header>
            {vehicles.data?.length ? (
              <ul className="divide-y divide-line">
                {vehicles.data.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/veiculos/${v.plate}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-paper sm:px-5"
                    >
                      <Plate value={v.plate} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {[v.brand, v.model].filter(Boolean).join(" ") || "—"}
                        </p>
                        <p className="text-xs text-steel">
                          {formatKm(v.last_mileage)} · {formatDate(v.updated_at)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<CarFront size={36} />} title="Nenhum veículo cadastrado">
                Os veículos são cadastrados automaticamente ao finalizar uma inspeção.
              </EmptyState>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
