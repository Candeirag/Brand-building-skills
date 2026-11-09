import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileDown, History, MessageCircle, Plus } from "lucide-react";
import { createInspection } from "../actions";
import { PhotoGallery, type GalleryGroup } from "@/components/inspection/photo-gallery";
import { buttonClass } from "@/components/ui/button";
import { Plate } from "@/components/ui/plate";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireStaff } from "@/lib/auth";
import { CHECKLIST_STATUS, fuelLabel, groupItems } from "@/lib/checklist";
import { formatDateTime, formatDocument, formatKm, formatPhone, formatPlate, maskDocument, whatsappLink } from "@/lib/format";
import { loadInspection } from "@/lib/inspection-data";
import { PHOTO_CATEGORIES } from "@/lib/photos";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await loadInspection(id);
  return { title: data?.inspection.number ?? "Inspeção" };
}

const STATUS_PILL = {
  ok: "bg-ok-soft text-ok",
  damaged: "bg-brand-red text-white",
  not_checked: "bg-paper text-graphite",
  not_applicable: "bg-paper text-steel",
} as const;

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-steel uppercase">{label}</dt>
      <dd className="mt-0.5 font-semibold break-words">{value || "—"}</dd>
    </div>
  );
}

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
  const labelByKey = new Map(items.map((it) => [it.item_key, it.item_label]));
  const galleryGroups: GalleryGroup[] = PHOTO_CATEGORIES.map((c) => ({
    label: c.label,
    photos: photos
      .filter((p) => p.category === c.value)
      .map((p) => ({ id: p.id, url: p.url, caption: p.caption, tag: p.item_key ? labelByKey.get(p.item_key) : undefined })),
  }));

  const contact = i.owner_whatsapp ?? i.owner_phone;
  const waText = `Olá${i.owner_name ? `, ${i.owner_name.split(" ")[0]}` : ""}! Registramos a entrada do seu veículo ${formatPlate(
    i.plate,
  )} na CAMPEÇAS em ${formatDateTime(i.finalized_at)}. Inspeção nº ${i.number}, quilometragem ${formatKm(i.mileage)}${
    damaged.length ? `, com ${damaged.length} avaria(s) preexistente(s) registrada(s)` : ", sem avarias registradas"
  }. Qualquer dúvida, estamos à disposição.`;
  const wa = whatsappLink(contact, waText);
  const isAdmin = profile.role === "admin";

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
      <Link href="/historico" className="inline-flex items-center gap-1.5 text-sm font-semibold text-steel hover:text-ink">
        <ArrowLeft size={16} /> Histórico
      </Link>

      {finalizada && (
        <div className="overflow-hidden rounded-2xl bg-ink text-white">
          <div className="racing-stripe h-1.5" aria-hidden="true" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 size={44} className="shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm text-white/60">Inspeção finalizada com sucesso</p>
                <p className="display text-3xl font-extrabold">{i.number}</p>
              </div>
            </div>
            <form action={createInspection}>
              <button type="submit" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                <Plus size={20} /> Nova inspeção
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Plate value={i.plate} size="lg" />
            <div>
              <p className="display text-2xl font-bold">{[i.brand, i.model].filter(Boolean).join(" ")}</p>
              <p className="text-sm text-steel">
                Nº <span className="font-mono font-semibold text-ink">{i.number}</span> · {formatDateTime(i.finalized_at)}
              </p>
              <div className="mt-1.5">
                <StatusBadge status={i.status} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/inspecoes/${i.id}/pdf`} target="_blank" rel="noopener" className={buttonClass("dark", "lg")}>
              <FileDown size={20} /> Relatório PDF
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "lg")}>
                <MessageCircle size={20} /> WhatsApp
              </a>
            )}
            {i.plate && (
              <Link href={`/veiculos/${i.plate}`} className={buttonClass("outline", "lg")}>
                <History size={20} /> Veículo
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg font-bold">Veículo</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Info label="Placa" value={formatPlate(i.plate)} />
            <Info label="Marca" value={i.brand} />
            <Info label="Modelo" value={i.model} />
            <Info label="Ano" value={i.year} />
            <Info label="Cor" value={i.color} />
            <Info label="Quilometragem" value={formatKm(i.mileage)} />
            <Info label="Combustível" value={fuelLabel(i.fuel_level)} />
            <Info label="Entrada" value={formatDateTime(i.started_at)} />
          </dl>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg font-bold">Proprietário</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Info label="Nome" value={i.owner_name} />
            </div>
            <Info
              label="CPF/CNPJ"
              value={i.owner_document ? (isAdmin ? formatDocument(i.owner_document) : maskDocument(i.owner_document)) : null}
            />
            <Info label="Telefone" value={formatPhone(i.owner_phone)} />
            <Info label="WhatsApp" value={formatPhone(i.owner_whatsapp)} />
          </dl>
        </section>
      </div>

      {damaged.length > 0 && (
        <section className="card border-brand-red/30 p-5 sm:p-6">
          <h2 className="display mb-3 flex items-center gap-2 text-lg font-bold text-brand-red">
            <AlertTriangle size={20} /> Avarias preexistentes ({damaged.length})
          </h2>
          <ul className="divide-y divide-line">
            {damaged.map((d) => (
              <li key={d.item_key} className="py-2.5">
                <p className="font-semibold">{d.item_label}</p>
                <p className="text-sm text-graphite">{d.notes}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="display mb-4 text-lg font-bold">Checklist</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {groupItems(items).map((g) => (
            <div key={g.name}>
              <h3 className="display mb-2 text-xs font-bold tracking-[0.18em] text-steel">{g.name}</h3>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {g.items.map((it) => (
                  <li key={it.item_key} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{it.item_label}</p>
                      {it.notes && it.status !== "damaged" && <p className="text-xs text-steel">{it.notes}</p>}
                      {it.item_key === "fuel" && i.fuel_level && (
                        <p className="text-xs text-steel">Nível: {fuelLabel(i.fuel_level)}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        it.status ? STATUS_PILL[it.status] : "bg-paper text-steel"
                      }`}
                    >
                      {it.status ? CHECKLIST_STATUS[it.status].label : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="display mb-4 text-lg font-bold">Fotografias ({photos.length})</h2>
        {photos.length ? <PhotoGallery groups={galleryGroups} /> : <p className="text-sm text-steel">Nenhuma foto registrada.</p>}
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="display mb-4 text-lg font-bold">Responsáveis</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Info label="Funcionário responsável" value={i.inspector_name} />
          <Info label="Mecânico responsável" value={i.mechanic_name} />
          <Info label="Finalizada em" value={formatDateTime(i.finalized_at)} />
        </dl>
        {i.notes && (
          <div className="mt-5">
            <p className="text-xs font-semibold tracking-wide text-steel uppercase">Observações</p>
            <p className="mt-1 text-sm whitespace-pre-line">{i.notes}</p>
          </div>
        )}
      </section>
    </main>
  );
}
