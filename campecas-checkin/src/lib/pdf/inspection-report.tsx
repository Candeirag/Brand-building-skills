import { Document, Image, Page, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { BRAND_DEEP, BRAND_RED, LOGO_LAYERS, LOGO_VIEWBOX } from "@/lib/brand";
import { CHECKLIST_STATUS, fuelLabel, groupItems } from "@/lib/checklist";
import { formatDateTime, formatKm, formatPhone, formatPlate } from "@/lib/format";
import { BODY_PATH, MAP_VIEWBOX, MAP_ZONES, ROOF_RECT, ZONE_STYLE, zoneState } from "@/lib/damage-map";
import { PHOTO_CATEGORIES } from "@/lib/photos";
import { workshopLines } from "@/lib/workshop";
import type { Tables } from "@/lib/supabase/database.types";

const C = {
  red: "#d9262d",
  ink: "#1f2433",
  deep: BRAND_DEEP,
  graphite: "#2b2d31",
  steel: "#6b7078",
  line: "#e3e4e7",
  paper: "#f3f4f6",
  ok: "#15803d",
  okSoft: "#e8f6ed",
  redSoft: "#fdeced",
};

const s = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 48, paddingHorizontal: 0, fontFamily: "Helvetica", fontSize: 9, color: C.ink },
  header: { backgroundColor: C.deep, paddingHorizontal: 32, paddingTop: 22, paddingBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandSub: { color: "#aab0c4", fontSize: 7, letterSpacing: 2.5, marginTop: 5 },
  headerRight: { alignItems: "flex-end" },
  docTitle: { color: "#c9cacd", fontSize: 8, letterSpacing: 1.5 },
  number: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 16, marginTop: 3 },
  headerDate: { color: "#9a9ca1", fontSize: 8, marginTop: 2 },
  stripe: { height: 4, backgroundColor: C.red },
  body: { paddingHorizontal: 32 },
  draft: { backgroundColor: C.redSoft, color: C.red, padding: 8, marginBottom: 10, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 10 },
  section: { marginBottom: 12 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.ink, paddingBottom: 4, marginBottom: 6, borderBottomWidth: 1.5, borderBottomColor: C.ink },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "25%", paddingRight: 8, marginBottom: 7 },
  cellWide: { width: "50%", paddingRight: 8, marginBottom: 7 },
  label: { fontSize: 6.5, color: C.steel, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1.5 },
  value: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  plate: { borderWidth: 1.5, borderColor: C.ink, borderRadius: 3, paddingHorizontal: 6, paddingTop: 5, paddingBottom: 2, fontFamily: "Courier-Bold", fontSize: 12, alignSelf: "flex-start", position: "relative" },
  checklistCols: { flexDirection: "row", gap: 12 },
  checklistCol: { flex: 1 },
  groupTitle: { fontSize: 7, color: C.steel, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 4, marginBottom: 3, fontFamily: "Helvetica-Bold" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3.2, borderBottomWidth: 0.5, borderBottomColor: C.line },
  itemLabel: { fontSize: 8.5, flex: 1, paddingRight: 6 },
  pill: { fontSize: 7, fontFamily: "Helvetica-Bold", paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6 },
  damageBox: { backgroundColor: C.redSoft, borderLeftWidth: 3, borderLeftColor: C.red, padding: 7, marginBottom: 5 },
  damageTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.ink },
  damageText: { fontSize: 8.5, color: C.graphite, marginTop: 2 },
  noDamage: { backgroundColor: C.okSoft, color: C.ok, padding: 7, fontFamily: "Helvetica-Bold", fontSize: 9 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  photoCell: { width: "33.333%", paddingHorizontal: 4, marginBottom: 8 },
  photo: { width: "100%", height: 118, objectFit: "cover", borderRadius: 3, backgroundColor: C.paper },
  photoCaption: { fontSize: 7, color: C.graphite, marginTop: 2.5 },
  notes: { fontSize: 9, lineHeight: 1.4, color: C.graphite },
  signRow: { flexDirection: "row", gap: 24, marginTop: 30 },
  signCol: { flex: 1, alignItems: "center" },
  signLine: { borderTopWidth: 0.8, borderTopColor: C.ink, width: "100%", marginBottom: 3 },
  signLabel: { fontSize: 7.5, color: C.steel },
  footer: { position: "absolute", bottom: 18, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 6, fontSize: 6.5, color: C.steel },
});

const PILL: Record<string, { bg: string; fg: string }> = {
  ok: { bg: C.okSoft, fg: C.ok },
  damaged: { bg: C.red, fg: "#ffffff" },
  not_checked: { bg: C.paper, fg: C.graphite },
  not_applicable: { bg: C.paper, fg: C.steel },
};

export type ReportPhoto = {
  id: string;
  category: Tables<"inspection_photos">["category"];
  item_key: string | null;
  data: Buffer | null;
};

export type ReportInspection = Pick<
  Tables<"inspections">,
  | "number" | "status" | "plate" | "brand" | "model" | "year" | "color" | "mileage" | "fuel_level"
  | "owner_name" | "notes" | "service_request" | "inspector_name" | "mechanic_name" | "started_at" | "finalized_at"
>;

export type ReportItem = Pick<
  Tables<"inspection_items">,
  "item_key" | "item_label" | "group_name" | "position" | "status" | "notes"
>;

export type ReportProps = {
  inspection: ReportInspection;
  items: ReportItem[];
  photos: ReportPhoto[];
  generatedAt: Date;
  /** CPF/CNPJ já mascarado. */
  maskedDocument: string | null;
  /** Telefone de contato (só no PDF interno; o laudo público não mostra telefone). */
  contactPhone: string | null;
};

function Field({ label, value, wide }: { label: string; value: string | number | null | undefined; wide?: boolean }) {
  return (
    <View style={wide ? s.cellWide : s.cell}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value === null || value === undefined || value === "" ? "–" : String(value)}</Text>
    </View>
  );
}

/** Logo da MINEIROCAR Auto Center em versão para fundo escuro (azul-escuro da marca). */
function BrandLogo() {
  const h = 54;
  const w = (h * LOGO_VIEWBOX[2]) / LOGO_VIEWBOX[3];
  return (
    <Svg width={w} height={h} viewBox={LOGO_VIEWBOX.join(" ")}>
      <Path d={LOGO_LAYERS.mark} fill={BRAND_RED} />
      <Path d={LOGO_LAYERS.wordBlue} fill="#ffffff" />
      <Path d={LOGO_LAYERS.wordRed} fill={BRAND_RED} />
      <Path d={LOGO_LAYERS.subtitle} fill="#ffffff" />
    </Svg>
  );
}

/** Mapa de avarias no laudo (mesma geometria e cores da tela). */
function DamageMapPdf({ statusByKey }: { statusByKey: Record<string, Tables<"inspection_items">["status"]> }) {
  const w = 92;
  const h = (w * MAP_VIEWBOX.height) / MAP_VIEWBOX.width;
  return (
    <View style={{ width: w, alignItems: "center" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}>
        <Path d={BODY_PATH} fill="#ffffff" stroke="#d4cfcf" strokeWidth={1.5} />
        <Rect x={ROOF_RECT.x} y={ROOF_RECT.y} width={ROOF_RECT.w} height={ROOF_RECT.h} rx={ROOF_RECT.r} fill="#f6f2f2" />
        {MAP_ZONES.flatMap((z) => {
          const st = ZONE_STYLE[zoneState(z, statusByKey)];
          return z.shapes.map((shape, idx) =>
            shape.kind === "rect" ? (
              <Rect
                key={`${z.id}-${idx}`}
                x={shape.x}
                y={shape.y}
                width={shape.w}
                height={shape.h}
                rx={shape.r ?? 0}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth={1.5}
                strokeDasharray={st.dashed ? "3 2" : undefined}
              />
            ) : (
              <Path
                key={`${z.id}-${idx}`}
                d={shape.d}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth={1.5}
                strokeDasharray={st.dashed ? "3 2" : undefined}
              />
            ),
          );
        })}
      </Svg>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
        <View style={{ width: 6, height: 6, backgroundColor: ZONE_STYLE.damaged.fill, borderRadius: 1, marginRight: 3 }} />
        <Text style={{ fontSize: 6.5, color: C.steel }}>Avariado</Text>
      </View>
    </View>
  );
}

export function InspectionReport({ inspection: i, items, photos, generatedAt, maskedDocument, contactPhone }: ReportProps) {
  const shop = workshopLines();
  const damaged = items.filter((it) => it.status === "damaged");
  const groups = groupItems(items);
  const half = Math.ceil(groups.length / 2);
  const columns = [groups.slice(0, half), groups.slice(half)];
  const labelByKey = new Map(items.map((it) => [it.item_key, it.item_label]));
  const orderedPhotos = PHOTO_CATEGORIES.flatMap((c) => photos.filter((p) => p.category === c.value && p.data));
  const categoryLabel = (p: ReportPhoto) => {
    const base = PHOTO_CATEGORIES.find((c) => c.value === p.category)?.label ?? "";
    return p.item_key ? `${base} · ${labelByKey.get(p.item_key) ?? ""}` : base;
  };
  const isDraft = i.status !== "finalized";
  const photoRows: ReportPhoto[][] = [];
  for (let n = 0; n < orderedPhotos.length; n += 3) photoRows.push(orderedPhotos.slice(n, n + 3));

  return (
    <Document
      title={`Inspeção ${i.number ?? "rascunho"}: ${formatPlate(i.plate)}`}
      author="MineiroCar Auto Center"
      subject="Relatório de inspeção de entrada de veículo"
      creator="Check-in MineiroCar"
      producer="Check-in MineiroCar"
      language="pt-BR"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <BrandLogo />
            <Text style={s.brandSub}>CHECK-IN · INSPEÇÃO DE ENTRADA</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docTitle}>RELATÓRIO DE INSPEÇÃO</Text>
            <Text style={s.number}>{i.number ?? "RASCUNHO"}</Text>
            <Text style={s.headerDate}>{formatDateTime(i.finalized_at ?? i.started_at)}</Text>
          </View>
        </View>
        <View style={s.stripe} fixed />
        <View style={{ height: 14 }} fixed />

        <View style={s.body}>
          {isDraft && <Text style={s.draft}>RASCUNHO: INSPEÇÃO AINDA NÃO FINALIZADA</Text>}

          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>Veículo</Text>
            <View style={s.grid}>
              <View style={s.cell}>
                <Text style={s.label}>Placa</Text>
                <Text style={s.plate}>{formatPlate(i.plate)}</Text>
              </View>
              <Field label="Marca" value={i.brand} />
              <Field label="Modelo" value={i.model} />
              <Field label="Ano" value={i.year} />
              <Field label="Cor" value={i.color} />
              <Field label="Quilometragem" value={formatKm(i.mileage)} />
              <Field label="Combustível" value={fuelLabel(i.fuel_level)} />
              <Field label="Data/hora de entrada" value={formatDateTime(i.started_at)} />
            </View>
          </View>

          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>Proprietário</Text>
            <View style={s.grid}>
              <Field label="Nome" value={i.owner_name} wide />
              <Field label="CPF/CNPJ" value={maskedDocument} />
              {contactPhone !== null && <Field label="Telefone / WhatsApp" value={formatPhone(contactPhone)} />}
            </View>
          </View>

          {i.service_request && (
            <View style={s.section} wrap={false}>
              <Text style={s.sectionTitle}>Serviço solicitado / queixa do cliente</Text>
              <Text style={s.notes}>{i.service_request}</Text>
            </View>
          )}

          <View style={s.section}>
            <Text style={s.sectionTitle}>Checklist de inspeção</Text>
            <View style={s.checklistCols}>
              {columns.map((col, idx) => (
                <View key={idx} style={s.checklistCol}>
                  {col.map((g) => (
                    <View key={g.name} wrap={false}>
                      <Text style={s.groupTitle}>{g.name}</Text>
                      {g.items.map((it) => {
                        const pill = it.status ? PILL[it.status]! : PILL.not_checked!;
                        return (
                          <View key={it.item_key} style={s.itemRow}>
                            <Text style={s.itemLabel}>
                              {it.item_label}

                            </Text>
                            <Text style={[s.pill, { backgroundColor: pill.bg, color: pill.fg }]}>
                              {it.status ? CHECKLIST_STATUS[it.status].label : "Pendente"}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Avarias preexistentes</Text>
            <View style={{ flexDirection: "row", gap: 16 }} wrap={false}>
              <DamageMapPdf statusByKey={Object.fromEntries(items.map((it) => [it.item_key, it.status]))} />
              <View style={{ flex: 1 }}>
                {damaged.length === 0 ? (
                  <Text style={s.noDamage}>Nenhuma avaria registrada no momento da entrada.</Text>
                ) : (
                  damaged.map((d) => (
                    <View key={d.item_key} style={s.damageBox} wrap={false}>
                      <Text style={s.damageTitle}>{d.item_label}</Text>
                      <Text style={s.damageText}>{d.notes}</Text>
                    </View>
                  ))
                )}
                {items
                  .filter((it) => it.status !== "damaged" && it.notes)
                  .map((it) => (
                    <Text key={it.item_key} style={[s.damageText, { marginTop: 3 }]}>
                      • {it.item_label}: {it.notes}
                    </Text>
                  ))}
              </View>
            </View>
          </View>

          {i.notes && (
            <View style={s.section} wrap={false}>
              <Text style={s.sectionTitle}>Observações</Text>
              <Text style={s.notes}>{i.notes}</Text>
            </View>
          )}

          {photoRows.length > 0 && (
            <View style={s.section}>
              {photoRows.map((row, idx) => (
                <View key={idx} wrap={false}>
                  {idx === 0 && <Text style={s.sectionTitle}>Fotografias ({orderedPhotos.length})</Text>}
                  <View style={s.photoGrid}>
                    {row.map((p) => (
                      <View key={p.id} style={s.photoCell}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF, sem atributo alt */}
                        <Image style={s.photo} src={{ data: p.data!, format: "jpg" }} />
                        <Text style={s.photoCaption}>{categoryLabel(p)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>Responsáveis</Text>
            <View style={s.grid}>
              <Field label="Funcionário responsável" value={i.inspector_name} wide />
              <Field label="Mecânico responsável" value={i.mechanic_name} wide />
            </View>
            <View style={s.signRow}>
              <View style={s.signCol}>
                <View style={s.signLine} />
                <Text style={s.signLabel}>Funcionário MineiroCar</Text>
              </View>
              <View style={s.signCol}>
                <View style={s.signLine} />
                <Text style={s.signLabel}>Cliente / responsável pelo veículo</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            {shop.length ? `${shop.join(" · ")} · ` : ""}Gerado em {formatDateTime(generatedAt)} · Dados pessoais tratados conforme a
            LGPD (Lei 13.709/2018)
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
