import type { Metadata } from "next";
import { ClipboardList, Plus } from "lucide-react";
import { createInspection } from "../actions";
import { InspectionRow } from "@/components/inspection/inspection-row";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { INSPECTION_LIST_COLUMNS, type InspectionListItem } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Em andamento" };

export default async function DraftsPage() {
  const profile = await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("inspections")
    .select(`${INSPECTION_LIST_COLUMNS}, inspector_id`)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(100);

  const mine = (data ?? []).filter((d) => d.inspector_id === profile.id) as InspectionListItem[];
  const others = (data ?? []).filter((d) => d.inspector_id !== profile.id) as InspectionListItem[];

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-3xl font-extrabold">Inspeções em andamento</h1>
          <p className="text-steel">Rascunhos salvos automaticamente. Toque para continuar.</p>
        </div>
        <form action={createInspection}>
          <button type="submit" className={buttonClass("primary", "lg", "w-full")}>
            <Plus size={20} /> Nova inspeção
          </button>
        </form>
      </div>

      {[
        { title: "Minhas", list: mine },
        { title: "Da equipe", list: others },
      ].map(({ title, list }) => (
        <section key={title} className="card overflow-hidden">
          <header className="border-b border-line px-4 py-3 sm:px-5">
            <h2 className="display text-lg font-bold">
              {title} <span className="text-steel">({list.length})</span>
            </h2>
          </header>
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((item) => (
                <InspectionRow key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <EmptyState icon={<ClipboardList size={32} />} title="Nenhum rascunho" />
          )}
        </section>
      ))}
    </main>
  );
}
