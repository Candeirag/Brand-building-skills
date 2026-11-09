import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import { InspectionRow } from "@/components/inspection/inspection-row";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { endOfDaySaoPaulo, isoDateInSaoPaulo, startOfDaySaoPaulo } from "@/lib/format";
import { INSPECTION_LIST_COLUMNS, type InspectionListItem } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { normalizePlate, sanitizeSearch } from "@/lib/validation";

export const metadata: Metadata = { title: "Histórico" };

const PAGE_SIZE = 20;
const isoDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

type SearchParams = { q?: string; de?: string; ate?: string; status?: string; periodo?: string; pagina?: string };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireStaff();
  const sp = await searchParams;
  const q = sanitizeSearch(sp.q);
  const today = isoDateInSaoPaulo();
  const from = sp.periodo === "hoje" ? today : isoDate(sp.de);
  const to = sp.periodo === "hoje" ? today : isoDate(sp.ate);
  const status = sp.status === "draft" || sp.status === "finalized" ? sp.status : undefined;
  const page = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("inspections")
    .select(INSPECTION_LIST_COLUMNS, { count: "exact" })
    .order("started_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) {
    const plate = normalizePlate(q);
    const terms = [`owner_name.ilike.*${q}*`, `number.ilike.*${q}*`];
    if (plate.length >= 3) terms.push(`plate.ilike.*${plate}*`);
    query = query.or(terms.join(","));
  }
  if (from) query = query.gte("started_at", startOfDaySaoPaulo(from));
  if (to) query = query.lte("started_at", endOfDaySaoPaulo(to));
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (from) params.set("de", from);
    if (to) params.set("ate", to);
    if (status) params.set("status", status);
    if (p > 1) params.set("pagina", String(p));
    return `/historico${params.size ? `?${params}` : ""}`;
  };

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
      <div>
        <h1 className="display text-3xl font-extrabold">Histórico de inspeções</h1>
        <p className="text-steel">Consulte inspeções por placa, proprietário, número ou período.</p>
      </div>

      <form method="get" className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end sm:p-5">
        <div>
          <label htmlFor="q" className="field-label">
            Busca
          </label>
          <div className="relative">
            <Search size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-steel" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={sp.q}
              placeholder="Placa, proprietário ou nº"
              className="field-input pl-11"
              enterKeyHint="search"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <div>
            <label htmlFor="de" className="field-label">
              De
            </label>
            <input id="de" name="de" type="date" defaultValue={from} max={today} className="field-input sm:w-40" />
          </div>
          <div>
            <label htmlFor="ate" className="field-label">
              Até
            </label>
            <input id="ate" name="ate" type="date" defaultValue={to} max={today} className="field-input sm:w-40" />
          </div>
        </div>
        <div>
          <label htmlFor="status" className="field-label">
            Situação
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className="field-input sm:w-44">
            <option value="">Todas</option>
            <option value="finalized">Finalizadas</option>
            <option value="draft">Em andamento</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonClass("dark", "lg", "flex-1 sm:flex-none")}>
            Filtrar
          </button>
          <Link href="/historico" className={buttonClass("outline", "lg")}>
            Limpar
          </Link>
        </div>
      </form>

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-graphite">
            {total} inspeç{total === 1 ? "ão" : "ões"} encontrada{total === 1 ? "" : "s"}
          </p>
          {pages > 1 && (
            <p className="text-sm text-steel">
              Página {page} de {pages}
            </p>
          )}
        </header>
        {error ? (
          <EmptyState title="Não foi possível carregar o histórico">Tente novamente em instantes.</EmptyState>
        ) : data?.length ? (
          <ul className="divide-y divide-line">
            {(data as InspectionListItem[]).map((item) => (
              <InspectionRow key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={<SearchX size={36} />} title="Nenhuma inspeção encontrada">
            Revise os filtros ou a grafia da busca.
          </EmptyState>
        )}
      </section>

      {pages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Paginação">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={buttonClass("outline", "md")}>
              <ChevronLeft size={18} /> Anterior
            </Link>
          ) : (
            <span />
          )}
          {page < pages && (
            <Link href={pageHref(page + 1)} className={buttonClass("outline", "md")}>
              Próxima <ChevronRight size={18} />
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
