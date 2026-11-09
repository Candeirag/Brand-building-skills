import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { InspectionRow, InspectionTableHeader } from "@/components/inspection/inspection-row";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { endOfDaySaoPaulo, formatNumber, isoDateInSaoPaulo, startOfDaySaoPaulo } from "@/lib/format";
import { INSPECTION_ROW_SELECT, toRowData } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { normalizePlate, sanitizeSearch } from "@/lib/validation";

export const metadata: Metadata = { title: "Histórico" };

/* Pergunta da tela: "Onde está a inspeção deste carro?": a tabela é o bloco inteiro. */
const PAGE_SIZE = 20;
const isoDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

type SearchParams = { q?: string; de?: string; ate?: string; status?: string; periodo?: string; pagina?: string };
type Status = "draft" | "finalized" | undefined;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireStaff();
  const sp = await searchParams;
  const q = sanitizeSearch(sp.q);
  const today = isoDateInSaoPaulo();
  const from = sp.periodo === "hoje" ? today : isoDate(sp.de);
  const to = sp.periodo === "hoje" ? today : isoDate(sp.ate);
  const status: Status = sp.status === "draft" || sp.status === "finalized" ? sp.status : undefined;
  const page = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);
  const now = new Date();

  const supabase = await createClient();

  // Os mesmos filtros (busca + período) valem para a lista e para as contagens das abas.
  function scoped<T extends { or: (f: string) => T; gte: (c: string, v: string) => T; lte: (c: string, v: string) => T }>(query: T): T {
    let qy = query;
    if (q) {
      const plate = normalizePlate(q);
      const terms = [`owner_name.ilike.*${q}*`, `number.ilike.*${q}*`];
      if (plate.length >= 3) terms.push(`plate.ilike.*${plate}*`);
      qy = qy.or(terms.join(","));
    }
    if (from) qy = qy.gte("started_at", startOfDaySaoPaulo(from));
    if (to) qy = qy.lte("started_at", endOfDaySaoPaulo(to));
    return qy;
  }

  let list = scoped(supabase.from("inspections").select(INSPECTION_ROW_SELECT, { count: "exact" }));
  if (status) list = list.eq("status", status);
  list = list.order("started_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const countFor = (s: Status) => {
    let c = scoped(supabase.from("inspections").select("id", { count: "exact", head: true }));
    if (s) c = c.eq("status", s);
    return c;
  };

  const [listRes, allRes, finRes, draftRes] = await Promise.all([list, countFor(undefined), countFor("finalized"), countFor("draft")]);
  const rows = (listRes.data ?? []).map(toRowData);
  const total = listRes.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstIdx = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastIdx = Math.min(page * PAGE_SIZE, total);

  const href = (overrides: Partial<{ status: Status; pagina: number }>) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (from) params.set("de", from);
    if (to) params.set("ate", to);
    const st = "status" in overrides ? overrides.status : status;
    if (st) params.set("status", st);
    const pg = overrides.pagina ?? 1;
    if (pg > 1) params.set("pagina", String(pg));
    return `/historico${params.size ? `?${params}` : ""}`;
  };

  const tabs: { label: string; value: Status; count: number }[] = [
    { label: "Todas", value: undefined, count: allRes.count ?? 0 },
    { label: "Finalizadas", value: "finalized", count: finRes.count ?? 0 },
    { label: "Em andamento", value: "draft", count: draftRes.count ?? 0 },
  ];
  const period =
    from && to && from === to ? (from === today ? "hoje" : `em ${from.split("-").reverse().join("/")}`) : from || to ? "no período" : "";

  return (
    <main className="mx-auto max-w-[1280px] px-4 pt-5 lg:px-8 lg:pt-8">
      <h1 className="h1">Histórico de inspeções</h1>
      <p className="mt-1 text-[15px] text-muted">
        {formatNumber(tabs[0]!.count)} inspeç{tabs[0]!.count === 1 ? "ão" : "ões"}
        {q ? ` para “${q}”` : ""} {period}
      </p>

      <nav aria-label="Situação" className="mt-5 flex gap-5 overflow-x-auto border-b border-border">
        {tabs.map((t) => {
          const active = t.value === status;
          return (
            <Link
              key={t.label}
              href={href({ status: t.value })}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex h-10 flex-none items-center gap-1.5 border-b-2 text-sm ${
                active ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label} <span className="num text-muted">{formatNumber(t.count)}</span>
            </Link>
          );
        })}
      </nav>

      <form method="get" className="mt-5 grid grid-cols-2 gap-3 md:flex md:items-end">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="col-span-2 flex gap-2 md:w-80">
          <label htmlFor="q" className="sr-only">
            Busca
          </label>
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input id="q" name="q" type="search" defaultValue={sp.q} placeholder="Placa, proprietário ou nº" className="field-input pl-9" enterKeyHint="search" />
          </div>
          <button type="submit" className={buttonClass("outline", "lg", "md:hidden")}>
            Filtrar
          </button>
        </div>
        <div>
          <label htmlFor="de" className="mb-1 block text-xs text-muted">
            Entrada de
          </label>
          <input id="de" name="de" type="date" defaultValue={from} max={today} className="field-input md:w-40" />
        </div>
        <div>
          <label htmlFor="ate" className="mb-1 block text-xs text-muted">
            até
          </label>
          <input id="ate" name="ate" type="date" defaultValue={to} max={today} className="field-input md:w-40" />
        </div>
        <div className={`col-span-2 gap-2 md:col-span-1 md:flex ${sp.q || from || to ? "flex" : "hidden"}`}>
          <button type="submit" className={buttonClass("outline", "lg", "hidden md:inline-flex")}>
            Filtrar
          </button>
          {(sp.q || from || to) && (
            <Link href={href({ status })} className={buttonClass("ghost", "lg")}>
              Limpar filtros
            </Link>
          )}
        </div>
      </form>

      <section className="panel mt-5 overflow-hidden" aria-label="Inspeções">
        {listRes.error ? (
          <EmptyState title="Não foi possível carregar o histórico.">Verifique a conexão e tente de novo.</EmptyState>
        ) : rows.length ? (
          <>
            <InspectionTableHeader />
            <ul className="border-t border-rule">
              {rows.map((item) => (
                <InspectionRow key={item.id} item={item} now={now} />
              ))}
            </ul>
          </>
        ) : (
          <EmptyState title="Nenhuma inspeção encontrada.">Confira a grafia da placa ou amplie o período.</EmptyState>
        )}
      </section>

      {total > 0 && (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginação">
          <p className="num text-sm text-muted">
            {formatNumber(firstIdx)}–{formatNumber(lastIdx)} de {formatNumber(total)}
          </p>
          {pages > 1 && (
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={href({ pagina: page - 1 })} className={buttonClass("outline", "md")}>
                  <ChevronLeft size={16} /> Anterior
                </Link>
              )}
              {page < pages && (
                <Link href={href({ pagina: page + 1 })} className={buttonClass("outline", "md")}>
                  Próxima <ChevronRight size={16} />
                </Link>
              )}
            </div>
          )}
        </nav>
      )}
    </main>
  );
}
