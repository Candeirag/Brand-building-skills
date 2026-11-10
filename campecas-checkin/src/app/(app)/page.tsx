import Link from "next/link";
import { NewInspectionButton } from "@/components/inspection/new-inspection-button";
import { PlateSearch } from "@/components/dashboard/plate-search";
import { InspectionRow, InspectionTableHeader } from "@/components/inspection/inspection-row";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plate } from "@/components/ui/plate";
import { requireStaff } from "@/lib/auth";
import { formatDate, formatNumber, isoDateInSaoPaulo, startOfDaySaoPaulo } from "@/lib/format";
import { INSPECTION_ROW_SELECT, toRowData, type InspectionRowData } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { elapsed } from "@/lib/time";
import { plural } from "@/lib/plural";

/*
 * Pergunta da tela: "Quais carros estão no pátio agora, há quanto tempo, e o que entrou hoje?"
 * Maior bloco: a lista "No pátio". Grid desktop: 1fr + coluna de 384 px, vão de 24 px.
 * Na área de 1136 px (1440 - 240 - 2x32): 728 + 24 + 384 = 1136.
 */
const LIST_LIMIT = 8;

export default async function DashboardPage() {
  await requireStaff();
  const supabase = await createClient();
  const now = new Date();
  const today = isoDateInSaoPaulo(now);
  const todayStart = startOfDaySaoPaulo(today);
  const monthStart = startOfDaySaoPaulo(`${today.slice(0, 7)}-01`);

  const [todayRes, yardRes, yardCountRes, oldestDraftRes, openRes, monthRes, vehiclesRes] = await Promise.all([
    // Rascunhos vazios (is_blank) não contam: ficam fora das listas e das contagens.
    supabase.from("inspections").select(INSPECTION_ROW_SELECT).eq("is_blank", false).gte("started_at", todayStart).order("started_at", { ascending: false }).limit(100),
    // No pátio = sem saída registrada (rascunhos e finalizadas), do mais antigo para o mais novo.
    supabase.from("inspections").select(INSPECTION_ROW_SELECT).eq("is_blank", false).is("yard_exits", null).order("started_at").limit(LIST_LIMIT),
    supabase.from("inspections").select("id, yard_exits(inspection_id)", { count: "exact", head: true }).eq("is_blank", false).is("yard_exits", null),
    supabase.from("inspections").select("started_at").eq("status", "draft").eq("is_blank", false).order("started_at").limit(1).maybeSingle(),
    supabase.from("inspections").select("id", { count: "exact", head: true }).eq("status", "draft").eq("is_blank", false),
    supabase.from("inspections").select("id", { count: "exact", head: true }).eq("status", "finalized").gte("finalized_at", monthStart),
    supabase.from("vehicles").select("id, plate, brand, model, last_mileage, updated_at").order("updated_at", { ascending: false }).limit(5),
  ]);

  // Um fato, uma variável: tudo que fala de "hoje" sai destas linhas.
  const todayRows = (todayRes.data ?? []).map(toRowData);
  const yard: InspectionRowData[] = (yardRes.data ?? []).map(toRowData);
  const yardTotal = yardCountRes.count ?? yard.length;
  const hidden = Math.max(0, yardTotal - yard.length);
  const todayWithDamage = todayRows.filter((r) => r.damages > 0).length;
  const openTotal = openRes.count ?? 0;

  const oldest = oldestDraftRes.data;
  const finding =
    openTotal > 0 && oldest
      ? openTotal === 1
        ? `1 em andamento · aberta ${elapsed(oldest.started_at, now)}`
        : `${openTotal} em andamento · mais antiga ${elapsed(oldest.started_at, now)}`
      : "Nenhuma inspeção aberta";
  const yardCaption = yard.length
    ? `${plural(yardTotal, "carro", "carros")} · o mais antigo entrou ${elapsed(yard[0]!.started_at, now)}`
    : "Nenhum carro no pátio";

  const kpis = [
    { label: "Entradas hoje", value: todayRows.length, caption: "desde 00:00" },
    { label: "Em andamento", value: openTotal, caption: "todas as datas", alert: openTotal > 0 },
    {
      label: "Com avarias",
      value: todayWithDamage,
      caption: todayRows.length ? `de ${plural(todayRows.length, "entrada", "entradas")} de hoje` : "nenhuma entrada hoje",
    },
    { label: "Finalizadas no mês", value: monthRes.count ?? 0, caption: "desde o dia 1º" },
  ];

  return (
    <main className="mx-auto max-w-[1280px] px-4 pt-5 lg:px-8 lg:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="h1">No pátio hoje</h1>
          <p className={`mt-1 text-[15px] ${oldest ? "text-ink" : "text-muted"}`}>
            {oldest && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" aria-hidden="true" />}
            {finding}
          </p>
        </div>
        <div className="flex-none">
          <NewInspectionButton />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
        <div className="min-w-0 space-y-6">
          <section aria-label="Indicadores" className="panel grid grid-cols-2 md:grid-cols-4">
            {kpis.map((k, i) => (
              <div
                key={k.label}
                className={`px-4 py-3.5 md:px-5 ${i % 2 ? "border-l border-border" : ""} ${i >= 2 ? "border-t border-border md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
              >
                <p className="text-sm text-muted">{k.label}</p>
                <p className={`num mt-1 text-2xl leading-8 font-medium ${k.alert ? "text-accent-ink" : "text-ink"}`}>{k.value}</p>
                <p className="text-xs text-muted">{k.caption}</p>
              </div>
            ))}
          </section>

          <section className="panel overflow-hidden" aria-labelledby="patio">
            <header className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <h2 id="patio" className="h2">No pátio</h2>
                <p className="text-xs text-muted">{yardCaption} · o tempo corre até registrar a saída</p>
              </div>
              <Link href="/historico?periodo=hoje" className="flex-none text-sm font-medium text-ink hover:underline">
                Entradas de hoje
              </Link>
            </header>
            {yard.length ? (
              <>
                <InspectionTableHeader />
                <ul className="border-t border-rule">
                  {yard.map((item) => (
                    <InspectionRow key={item.id} item={item} now={now} />
                  ))}
                </ul>
                {hidden > 0 && (
                  <p className="border-t border-rule px-4 py-2.5 text-sm text-muted">
                    Mais {plural(hidden, "carro", "carros")} no pátio. Veja no{" "}
                    <Link href="/historico" className="font-medium text-ink hover:underline">
                      histórico
                    </Link>
                  </p>
                )}
              </>
            ) : (
              <EmptyState title="Nenhum veículo no pátio.">Toque em Nova inspeção quando o próximo carro chegar.</EmptyState>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section>
            <h2 className="h2 mb-2">Buscar inspeção</h2>
            <div className="panel p-3">
              <PlateSearch />
            </div>
          </section>
          <section>
            <h2 className="h2 mb-2">Veículos atendidos recentemente</h2>
            <div className="panel overflow-hidden">
              {vehiclesRes.data?.length ? (
                <ul>
                  {vehiclesRes.data.map((v) => (
                    <li key={v.id} className="border-t border-rule first:border-t-0">
                      <Link href={`/veiculos/${v.plate}`} className="flex h-14 items-center gap-3 px-4 hover:bg-raised">
                        <Plate value={v.plate} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {[v.brand, v.model].filter(Boolean).join(" ") || "–"}
                          </span>
                          <span className="block text-xs text-muted">{formatDate(v.updated_at)}</span>
                        </span>
                        <span className="num text-right text-sm">
                          {v.last_mileage != null ? formatNumber(v.last_mileage) : "–"}
                          <span className="text-muted"> km</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Nenhum veículo cadastrado.">Os veículos entram aqui ao finalizar a primeira inspeção.</EmptyState>
              )}
              <div className="border-t border-rule p-3">
                <Link href="/historico" className={buttonClass("outline", "sm", "w-full")}>
                  Ver histórico completo
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
