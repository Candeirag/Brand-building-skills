/** Colunas usadas nas listagens de inspeções. */
export const INSPECTION_LIST_COLUMNS =
  "id, number, status, plate, brand, model, color, mileage, owner_name, inspector_name, started_at, finalized_at, updated_at" as const;

/** Listagem com contagem de avarias e de fotos (embeds do PostgREST). */
export const INSPECTION_ROW_SELECT =
  `${INSPECTION_LIST_COLUMNS}, inspection_items(status), inspection_photos(count), report_deliveries(sent_at)` as const;

export type InspectionListItem = {
  id: string;
  number: string | null;
  status: "draft" | "finalized";
  plate: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  mileage: number | null;
  owner_name: string | null;
  inspector_name: string | null;
  started_at: string;
  finalized_at: string | null;
  updated_at: string;
};

/** lastSentAt: último envio do laudo ao cliente pelo WhatsApp. */
export type InspectionRowData = InspectionListItem & { damages: number; photos: number; lastSentAt: string | null };

type RawRow = InspectionListItem & {
  inspection_items?: { status: string | null }[] | null;
  inspection_photos?: { count: number }[] | null;
  report_deliveries?: { sent_at: string }[] | null;
};

export function toRowData(row: RawRow): InspectionRowData {
  const { inspection_items, inspection_photos, report_deliveries, ...rest } = row;
  const sent = (report_deliveries ?? []).map((d) => d.sent_at).sort();
  return {
    ...rest,
    damages: (inspection_items ?? []).filter((i) => i.status === "damaged").length,
    photos: inspection_photos?.[0]?.count ?? 0,
    lastSentAt: sent.length ? sent[sent.length - 1]! : null,
  };
}
