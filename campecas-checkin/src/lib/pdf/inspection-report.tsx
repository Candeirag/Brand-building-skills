import { Document, Image, Page, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { CHECKLIST_STATUS, fuelLabel, groupItems } from "@/lib/checklist";
import { formatDateTime, formatKm, formatPhone, formatPlate, maskDocument } from "@/lib/format";
import { PHOTO_CATEGORIES } from "@/lib/photos";
import type { Tables } from "@/lib/supabase/database.types";

const C = {
  red: "#e10600",
  ink: "#0b0b0c",
  graphite: "#2b2d31",
  steel: "#6b7078",
  line: "#e3e4e7",
  paper: "#f3f4f6",
  ok: "#15803d",
  okSoft: "#e8f6ed",
  redSoft: "#fdeceb",
};

const s = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 48, paddingHorizontal: 0, fontFamily: "Helvetica", fontSize: 9, color: C.ink },
  header: { backgroundColor: C.ink, paddingHorizontal: 32, paddingTop: 22, paddingBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brand: { color: "#fff", fontFamily: "Helvetica-BoldOblique", fontSize: 22, letterSpacing: 1 },
  brandSub: { color: "#9a9ca1", fontSize: 7.5, letterSpacing: 3, marginTop: 2 },
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

export type ReportProps = {
  inspection: Tables<"inspections">;
  items: Tables<"inspection_items">[];
  photos: ReportPhoto[];
  generatedAt: Date;
};

function Field({ label, value, wide }: { label: string; value: string | number | null | undefined; wide?: boolean }) {
  return (
    <View style={wide ? s.cellWide : s.cell}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value === null || value === undefined || value === "" ? "—" : String(value)}</Text>
    </View>
  );
}

function LogoMark() {
  return (
    <Svg width={34} height={34} viewBox="0 0 64 64" style={{ marginRight: 10 }}>
      <Rect width="64" height="64" rx="14" fill={C.red} />
      <Path d="M14 40 L26 18 H50 L44 28 H32 L28 36 H40 L34 46 H14 Z" fill="#ffffff" />
      <Path d="M38 46 L52 22" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}

export function InspectionReport({ inspection: i, items, photos, generatedAt }: ReportProps) {
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
      title={`Inspeção ${i.number ?? "rascunho"} — ${formatPlate(i.plate)}`}
      author="CAMPEÇAS"
      subject="Relatório de inspeção de entrada de veículo"
      creator="CAMPEÇAS CHECK-IN"
      producer="CAMPEÇAS CHECK-IN"
      language="pt-BR"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <LogoMark />
            <View>
              <Text style={s.brand}>CAMPEÇAS</Text>
              <Text style={s.brandSub}>CHECK-IN · INSPEÇÃO DE ENTRADA</Text>
            </View>
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
          {isDraft && <Text style={s.draft}>RASCUNHO — INSPEÇÃO AINDA NÃO FINALIZADA</Text>}

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
              <Field label="CPF/CNPJ" value={i.owner_document ? maskDocument(i.owner_document) : null} />
              <Field label="Telefone / WhatsApp" value={formatPhone(i.owner_whatsapp ?? i.owner_phone)} />
            </View>
          </View>

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
                              {it.item_key === "fuel" && i.fuel_level ? ` (${fuelLabel(i.fuel_level)})` : ""}
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
                <Text style={s.signLabel}>Funcionário CAMPEÇAS</Text>
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
            CAMPEÇAS CHECK-IN · Gerado em {formatDateTime(generatedAt)} · Dados pessoais tratados conforme a LGPD (Lei 13.709/2018)
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
