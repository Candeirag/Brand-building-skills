import type { Metadata } from "next";
import { NewInspectionButton } from "@/components/inspection/new-inspection-button";
import { InspectionRow, InspectionTableHeader } from "@/components/inspection/inspection-row";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { INSPECTION_ROW_SELECT, toRowData, type InspectionRowData } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { elapsed } from "@/lib/time";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Em andamento" };

/* Pergunta da tela: "Qual rascunho eu preciso terminar?": os meus primeiro, do mais antigo. */
export default async function DraftsPage() {
  const profile = await requireStaff();
  const supabase = await createClient();
  const now = new Date();
  const { data } = await supabase
    .from("inspections")
    .select(`${INSPECTION_ROW_SELECT}, inspector_id`)
    .eq("status", "draft")
    .eq("is_blank", false)
    .order("started_at", { ascending: true })
    .limit(100);

  const all = (data ?? []).map((d) => ({ ...toRowData(d), inspector_id: d.inspector_id }));
  const mine: InspectionRowData[] = all.filter((d) => d.inspector_id === profile.id);
  const others: InspectionRowData[] = all.filter((d) => d.inspector_id !== profile.id);
  const oldest = all[0];

  return (
    <main className="mx-auto max-w-[1280px] px-4 pt-5 lg:px-8 lg:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="h1">Inspeções em andamento</h1>
          <p className="mt-1 text-[15px] text-muted">
            {all.length
              ? `${plural(all.length, "aberta", "abertas")}; a mais antiga começou ${elapsed(oldest!.started_at, now)}. O rascunho é salvo automaticamente.`
              : "Nenhum rascunho aberto. Todas as inspeções foram finalizadas."}
          </p>
        </div>
        <div className="flex-none">
          <NewInspectionButton />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {[
          { title: "Iniciadas por você", list: mine, empty: "Você não tem rascunhos abertos." },
          { title: "Iniciadas pela equipe", list: others, empty: "Nenhum rascunho aberto pela equipe." },
        ].map(({ title, list, empty }) => (
          <section key={title} className="panel overflow-hidden">
            <header className="flex items-baseline justify-between px-4 py-3.5">
              <h2 className="h2">{title}</h2>
              <span className="num text-sm text-muted">{list.length}</span>
            </header>
            {list.length ? (
              <>
                <InspectionTableHeader />
                <ul className="border-t border-rule">
                  {list.map((item) => (
                    <InspectionRow key={item.id} item={item} now={now} />
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState title={empty} />
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
