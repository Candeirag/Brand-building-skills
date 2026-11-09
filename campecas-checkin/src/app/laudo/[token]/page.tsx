import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, FileDown } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DamageMap } from "@/components/inspection/damage-map";
import { PhotoGallery, type GalleryGroup } from "@/components/inspection/photo-gallery";
import { buttonClass } from "@/components/ui/button";
import { Plate } from "@/components/ui/plate";
import { CHECKLIST_STATUS, fuelLabel, groupItems } from "@/lib/checklist";
import { formatDate, formatDateTime, formatNumber, formatPlate, formatTime } from "@/lib/format";
import { PHOTO_CATEGORIES } from "@/lib/photos";
import { plural } from "@/lib/plural";
import { loadPublicReport } from "@/lib/public-report";
import { WORKSHOP, workshopLines } from "@/lib/workshop";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Laudo de entrada",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

const STATUS_TEXT = {
  ok: "text-muted",
  damaged: "font-medium text-accent-ink",
  not_checked: "text-muted",
  not_applicable: "text-muted",
} as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-h-9 items-baseline justify-between gap-4 border-t border-rule py-2 first:border-t-0">
      <dt className="flex-none text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm break-words">{value || <span className="text-muted">–</span>}</dd>
    </div>
  );
}

/*
 * Laudo público do cliente (link enviado pelo WhatsApp). Lido no servidor por
 * public_report(), que valida o token; nenhuma tabela é aberta para anônimos.
 * Pergunta da tela: "Em que estado o meu carro entrou na oficina?"
 */
export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await loadPublicReport(token);
  if (!r) notFound();

  const damaged = r.items.filter((i) => i.status === "damaged");
  const statusByKey = Object.fromEntries(r.items.map((i) => [i.item_key, i.status]));
  const labelByKey = new Map(r.items.map((i) => [i.item_key, i.item_label]));
  const groups: GalleryGroup[] = PHOTO_CATEGORIES.map((c) => ({
    label: c.label,
    photos: r.photos
      .filter((p) => p.category === c.value)
      .map((p) => ({ id: p.id, url: p.url, caption: p.caption, tag: p.item_key ? labelByKey.get(p.item_key) : undefined })),
  }));
  const vehicle = [r.brand, r.model].filter(Boolean).join(" ") || "Veículo";
  const shop = workshopLines();

  return (
    <div className="min-h-dvh bg-ground">
      <header className="bg-ink px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-5 text-white sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Logo tone="dark" height={34} />
          <div className="text-sm text-white/80 sm:text-right">
            {shop.length ? shop.map((l) => <p key={l}>{l}</p>) : <p>Oficina {WORKSHOP.name}</p>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6 sm:py-8">
        <section className="panel p-4 sm:p-5">
          <p className="text-sm text-muted">Laudo de entrada do veículo</p>
          <div className="mt-2 flex items-center gap-3">
            <Plate value={r.plate} size="md" />
            <div className="min-w-0">
              <h1 className="h1 truncate">{vehicle}</h1>
              <p className="num text-sm text-muted">Nº {r.number}</p>
            </div>
          </div>
          <dl className="mt-4">
            <Row label="Entrada" value={`${formatDate(r.started_at)} às ${formatTime(r.started_at)}`} />
            <Row label="Quilometragem" value={r.mileage != null ? `${formatNumber(r.mileage)} km` : null} />
            <Row label="Nível de combustível" value={r.fuel_level ? fuelLabel(r.fuel_level) : null} />
            <Row label="Ano e cor" value={[r.year, r.color].filter(Boolean).join(" · ")} />
            <Row label="Proprietário" value={r.owner_name} />
            <Row label="CPF/CNPJ" value={r.owner_document_masked} />
          </dl>
          <a
            href={`/laudo/${token}/pdf`}
            target="_blank"
            rel="noopener"
            className={buttonClass("primary", "lg", "mt-4 w-full sm:w-auto")}
          >
            <FileDown size={18} /> Baixar o laudo em PDF
          </a>
        </section>

        {r.service_request && (
          <section className="panel p-4 sm:p-5">
            <h2 className="h2">Serviço solicitado</h2>
            <p className="mt-1 text-[15px] whitespace-pre-line">{r.service_request}</p>
          </section>
        )}

        <section className="panel p-4 sm:p-5" aria-labelledby="estado">
          <h2 id="estado" className="h2">
            Estado na entrada
          </h2>
          <p className="text-sm text-muted">
            {damaged.length
              ? `${plural(damaged.length, "avaria preexistente registrada", "avarias preexistentes registradas")} antes do serviço`
              : "Nenhuma avaria registrada antes do serviço"}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div className="mx-auto w-36 sm:w-auto">
              <DamageMap statusByKey={statusByKey} />
            </div>
            <div className="min-w-0">
              {damaged.length ? (
                <ul className="divide-y divide-rule">
                  {damaged.map((d) => (
                    <li key={d.item_key} className="py-2.5 first:pt-0">
                      <p className="flex items-center gap-2 font-medium">
                        <AlertTriangle size={15} className="flex-none text-accent" />
                        {d.item_label}
                      </p>
                      <p className="mt-0.5 pl-6 text-sm">{d.notes}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-card border border-dashed border-dash px-4 py-3 text-sm text-muted">
                  Todos os itens conferidos sem dano.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="panel p-4 sm:p-5">
          <h2 className="h2">Checklist</h2>
          <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {groupItems(r.items).map((g) => (
              <div key={g.name}>
                <h3 className="mb-0.5 text-xs text-muted">{g.name}</h3>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.item_key} className="flex min-h-9 items-baseline justify-between gap-3 border-t border-rule py-2 first:border-t-0">
                      <span className="min-w-0 text-sm">
                        {it.item_label}
                        {it.notes && it.status !== "damaged" && <span className="block text-xs text-muted">{it.notes}</span>}
                      </span>
                      <span className={`flex-none text-sm ${it.status ? STATUS_TEXT[it.status] : "text-muted"}`}>
                        {it.status ? CHECKLIST_STATUS[it.status].label : "–"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-4 sm:p-5">
          <h2 className="h2">Fotografias</h2>
          <p className="mb-4 text-sm text-muted">{plural(r.photos.length, "foto registrada", "fotos registradas")} na entrada</p>
          {r.photos.length ? (
            <PhotoGallery groups={groups} />
          ) : (
            <p className="text-sm text-muted">Nenhuma foto registrada.</p>
          )}
        </section>

        {r.notes && (
          <section className="panel p-4 sm:p-5">
            <h2 className="h2">Observações</h2>
            <p className="mt-1 text-sm whitespace-pre-line">{r.notes}</p>
          </section>
        )}

        <section className="panel p-4 sm:p-5">
          <dl>
            <Row label="Funcionário responsável" value={r.inspector_name} />
            <Row label="Mecânico responsável" value={r.mechanic_name} />
            <Row label="Laudo finalizado" value={formatDateTime(r.finalized_at)} />
          </dl>
        </section>

        <p className="px-1 pb-6 text-xs leading-relaxed text-muted">
          Este link é pessoal e vale até {formatDate(r.expires_at)}. Laudo nº {r.number}, placa {formatPlate(r.plate)}. Os dados
          pessoais são tratados conforme a LGPD; o documento aparece mascarado e o telefone não é exibido.{" "}
          <a href="/privacidade" className="underline underline-offset-2">
            Privacidade
          </a>
        </p>
      </main>
    </div>
  );
}
