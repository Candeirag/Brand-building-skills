import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, FileDown, MessageCircle, Plus } from "lucide-react";
import { createInspection } from "../actions";
import { DamageMap } from "@/components/inspection/damage-map";
import { PhotoGallery, type GalleryGroup } from "@/components/inspection/photo-gallery";
import { buttonClass } from "@/components/ui/button";
import { Plate } from "@/components/ui/plate";
import { requireStaff } from "@/lib/auth";
import { CHECKLIST_STATUS, fuelLabel, groupItems } from "@/lib/checklist";
import { MAPPED_KEYS } from "@/lib/damage-map";
import {
  formatDateTime,
  formatDocument,
  formatKm,
  formatNumber,
  formatPhone,
  formatPlate,
  formatTime,
  maskDocument,
  whatsappLink,
} from "@/lib/format";
import { loadInspection } from "@/lib/inspection-data";
import { PHOTO_CATEGORIES } from "@/lib/photos";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await loadInspection(id);
  return { title: data?.inspection.number ?? "Inspeção" };
}

/* Cinza para o que está bem; a cor fica só na linha em risco. */
const STATUS_TEXT = {
  ok: "text-muted",
  damaged: "font-medium text-accent-ink",
  not_checked: "text-muted",
  not_applicable: "text-muted",
} as const;

function KeyValue({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-rule">
      {rows.map(([k, v]) => (
        <div key={k} className="flex min-h-9 items-baseline justify-between gap-4 py-2">
          <dt className="flex-none text-sm text-muted">{k}</dt>
          <dd className="min-w-0 text-right text-sm break-words">{v || <span className="text-muted">–</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/*
 * Pergunta da tela: "Em que estado este carro entrou?": respondida pelo mapa de avarias (maior bloco).
 * Grid desktop igual ao painel: 1fr + 384 px, vão de 24 px.
 */
export default async function InspectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ finalizada?: string }>;
}) {
  const [{ id }, { finalizada }] = await Promise.all([params, searchParams]);
  const profile = await requireStaff();
  const data = await loadInspection(id);
  if (!data) notFound();
  const { inspection: i, items, photos } = data;
  if (i.status === "draft") redirect(`/inspecoes/${id}/editar`);

  const damaged = items.filter((it) => it.status === "damaged");
  const groups = groupItems(items);
  const statusByKey = Object.fromEntries(items.map((it) => [it.item_key, it.status]));
  const offMapDamaged = damaged.filter((d) => !MAPPED_KEYS.has(d.item_key));
  const labelByKey = new Map(items.map((it) => [it.item_key, it.item_label]));
  const photosByItem = new Map<string, number>();
  photos.forEach((p) => p.item_key && photosByItem.set(p.item_key, (photosByItem.get(p.item_key) ?? 0) + 1));
  const galleryGroups: GalleryGroup[] = PHOTO_CATEGORIES.map((c) => ({
    label: c.label,
    photos: photos
      .filter((p) => p.category === c.value)
      .map((p) => ({ id: p.id, url: p.url, caption: p.caption, tag: p.item_key ? labelByKey.get(p.item_key) : undefined })),
  }));
  const missingAngles = PHOTO_CATEGORIES.filter((c) => c.recommended && !photos.some((p) => p.category === c.value));

  const contact = i.owner_whatsapp ?? i.owner_phone;
  const waText = `Olá${i.owner_name ? `, ${i.owner_name.split(" ")[0]}` : ""}! Registramos a entrada do seu veículo ${formatPlate(
    i.plate,
  )} na CAMPEÇAS em ${formatDateTime(i.finalized_at)}. Inspeção nº ${i.number}, quilometragem ${formatKm(i.mileage)}${
    damaged.length ? `, com ${damaged.length} avaria(s) preexistente(s) registrada(s)` : ", sem avarias registradas"
  }. Qualquer dúvida, estamos à disposição.`;
  const wa = whatsappLink(contact, waText);
  const isAdmin = profile.role === "admin";
  const vehicleName = [i.brand, i.model].filter(Boolean).join(" ");

  const kpis = [
    { label: "Quilometragem", value: i.mileage != null ? formatNumber(i.mileage) : "–", unit: i.mileage != null ? "km" : "" },
    { label: "Combustível", value: fuelLabel(i.fuel_level), unit: "" },
    { label: "Avarias", value: String(damaged.length), unit: `de ${items.length} itens`, alert: damaged.length > 0 },
    { label: "Fotografias", value: String(photos.length), unit: "" },
  ];

  return (
    <main className="mx-auto max-w-[1280px] px-4 pt-5 lg:px-8 lg:pt-8">
      {finalizada && (
        <div className="mb-5 flex flex-col gap-3 rounded-card border border-positive/25 bg-positive-bg px-4 py-3 text-positive-ink sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2.5 text-sm">
            <CheckCircle2 size={18} className="flex-none text-positive" />
            <span>
              Inspeção <strong className="num font-semibold">{i.number}</strong> finalizada às {formatTime(i.finalized_at)}. O
              registro não pode mais ser alterado.
            </span>
          </p>
          <form action={createInspection} className="flex-none">
            <button type="submit" className={buttonClass("outline", "md", "w-full")}>
              <Plus size={16} /> Próxima inspeção
            </button>
          </form>
        </div>
      )}

      <nav aria-label="Caminho" className="text-sm text-muted">
        <Link href="/historico" className="hover:text-ink">
          Histórico
        </Link>
        {i.plate && (
          <>
            {" / "}
            <Link href={`/veiculos/${i.plate}`} className="hover:text-ink">
              {formatPlate(i.plate)}
            </Link>
          </>
        )}
      </nav>
      <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Plate value={i.plate} size="lg" />
          <div className="min-w-0">
            <h1 className="h1 num">{i.number}</h1>
            <p className="truncate text-[15px] text-muted">
              {vehicleName || "Veículo"} · finalizada {formatDateTime(i.finalized_at)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <a href={`/api/inspecoes/${i.id}/pdf`} target="_blank" rel="noopener" className={buttonClass("primary", "lg", "col-span-2 sm:h-10")}>
            <FileDown size={18} /> Relatório PDF
          </a>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "lg", "sm:h-10")}>
              <MessageCircle size={18} /> WhatsApp
            </a>
          )}
          {i.plate && (
            <Link href={`/veiculos/${i.plate}`} className={buttonClass("outline", "lg", "sm:h-10")}>
              Histórico do veículo
            </Link>
          )}
        </div>
      </div>

      <section aria-label="Resumo" className="panel mt-6 grid grid-cols-2 md:grid-cols-4">
        {kpis.map((k, idx) => (
          <div
            key={k.label}
            className={`px-4 py-3.5 md:px-5 ${idx % 2 ? "border-l border-border" : ""} ${idx >= 2 ? "border-t border-border md:border-t-0" : ""} ${idx === 2 ? "md:border-l" : ""}`}
          >
            <p className="text-sm text-muted">{k.label}</p>
            <p className={`num mt-1 text-2xl leading-8 font-medium ${k.alert ? "text-accent-ink" : ""}`}>
              {k.value} {k.unit && <span className="text-sm font-normal text-muted">{k.unit}</span>}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
        <div className="min-w-0 space-y-6">
          <section className="panel p-5" aria-labelledby="mapa">
            <h2 id="mapa" className="h2">
              Estado na entrada
            </h2>
            <p className="text-sm text-muted">
              {damaged.length
                ? `${damaged.length} avaria${damaged.length > 1 ? "s" : ""} preexistente${damaged.length > 1 ? "s" : ""} em ${items.length} itens conferidos antes do serviço`
                : `Nenhuma avaria nos ${items.length} itens conferidos antes do serviço`}
            </p>
            {/* Mapa (200 px) + checklist em duas colunas de grupos; o mapa e a lista vêm das mesmas linhas. */}
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
              <div className="mx-auto w-40 md:w-auto">
                <DamageMap statusByKey={statusByKey} />
                {offMapDamaged.length > 0 && (
                  <p className="mt-2 text-center text-xs text-muted">Fora do mapa: {offMapDamaged.map((d) => d.item_label).join(", ")}</p>
                )}
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 xl:grid-cols-2">
                {[groups.filter((g) => g.name === "Exterior"), groups.filter((g) => g.name !== "Exterior")].map((col, ci) => (
                  <div key={ci} className="min-w-0 space-y-4">
                    {col.map((g) => (
                      <div key={g.name}>
                        <h3 className="mb-0.5 text-xs text-muted">{g.name}</h3>
                        <ul className="divide-y divide-rule">
                          {g.items.map((it) => (
                            <li key={it.item_key} className="py-2">
                              <p className="flex items-baseline justify-between gap-3">
                                <span className="flex min-w-0 items-center gap-2 text-sm">
                                  {it.status === "damaged" && <span className="h-2 w-2 flex-none rounded-full bg-accent" aria-hidden="true" />}
                                  <span className={it.status === "damaged" ? "font-medium" : ""}>{it.item_label}</span>
                                  {it.item_key === "fuel" && i.fuel_level && <span className="text-muted">· {fuelLabel(i.fuel_level)}</span>}
                                </span>
                                <span className={`flex-none text-sm ${it.status ? STATUS_TEXT[it.status] : "text-muted"}`}>
                                  {it.status ? CHECKLIST_STATUS[it.status].label : "–"}
                                </span>
                              </p>
                              {it.notes && (
                                <p className={`mt-0.5 text-[13px] ${it.status === "damaged" ? "pl-4 text-ink" : "text-muted"}`}>
                                  {it.notes}
                                  {it.status === "damaged" && (photosByItem.get(it.item_key) ?? 0) > 0 && (
                                    <span className="text-muted">
                                      {" "}
                                      · {photosByItem.get(it.item_key)} foto{photosByItem.get(it.item_key) === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel p-5" aria-labelledby="fotos">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="fotos" className="h2">
                Fotografias
              </h2>
              <span className="num text-sm text-muted">{photos.length}</span>
            </div>
            {missingAngles.length > 0 && (
              <p className="mt-0.5 text-sm text-muted">Sem foto: {missingAngles.map((m) => m.label.toLowerCase()).join(", ")}.</p>
            )}
            <div className="mt-4">
              {photos.length ? (
                <PhotoGallery groups={galleryGroups} />
              ) : (
                <p className="rounded-card border border-dashed border-control px-4 py-3 text-sm text-muted">Nenhuma foto registrada.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section>
            <h2 className="h2 mb-2">Veículo</h2>
            <div className="panel px-4 py-1">
              <KeyValue
                rows={[
                  ["Placa", <span key="p" className="id-type">{formatPlate(i.plate)}</span>],
                  ["Marca e modelo", vehicleName],
                  ["Ano", i.year],
                  ["Cor", i.color],
                  ["Entrada", formatDateTime(i.started_at)],
                ]}
              />
            </div>
          </section>
          <section>
            <h2 className="h2 mb-2">Proprietário</h2>
            <div className="panel px-4 py-1">
              <KeyValue
                rows={[
                  ["Nome", i.owner_name],
                  [
                    "CPF/CNPJ",
                    i.owner_document ? (isAdmin ? formatDocument(i.owner_document) : maskDocument(i.owner_document)) : null,
                  ],
                  ["Telefone", formatPhone(i.owner_phone)],
                  ["WhatsApp", formatPhone(i.owner_whatsapp)],
                ]}
              />
            </div>
          </section>
          <section>
            <h2 className="h2 mb-2">Responsáveis</h2>
            <div className="panel px-4 py-1">
              <KeyValue
                rows={[
                  ["Funcionário", i.inspector_name],
                  ["Mecânico", i.mechanic_name],
                  ["Finalizada", formatDateTime(i.finalized_at)],
                ]}
              />
              {i.notes && (
                <div className="border-t border-rule py-3">
                  <p className="text-sm text-muted">Observações</p>
                  <p className="mt-1 text-sm whitespace-pre-line">{i.notes}</p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
