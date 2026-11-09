import { readFileSync, writeFileSync } from "node:fs";
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { InspectionReport, type ReportPhoto } from "@/lib/pdf/inspection-report";
import type { Tables } from "@/lib/supabase/database.types";

const LABELS: [string, string, string][] = [
  ["front_bumper", "Para-choque dianteiro", "Exterior"],
  ["rear_bumper", "Para-choque traseiro", "Exterior"],
  ["hood", "Capô", "Exterior"],
  ["doors", "Portas", "Exterior"],
  ["trunk", "Porta-malas", "Exterior"],
  ["mirrors", "Retrovisores", "Exterior"],
  ["headlights", "Faróis", "Exterior"],
  ["taillights", "Lanternas", "Exterior"],
  ["windows", "Vidros", "Exterior"],
  ["wheels", "Rodas", "Rodas e pneus"],
  ["tires", "Pneus", "Rodas e pneus"],
  ["seats", "Bancos", "Interior"],
  ["dashboard", "Painel", "Interior"],
  ["interior", "Interior do veículo", "Interior"],
  ["warning_lights", "Luzes de advertência", "Interior"],
  ["fuel", "Combustível", "Outros"],
  ["personal_items", "Objetos pessoais", "Outros"],
  ["other_damage", "Outros danos", "Outros"],
];

const inspection: Tables<"inspections"> = {
  id: "11111111-1111-1111-1111-111111111111",
  number: "CP2026-000123",
  status: "finalized",
  vehicle_id: null,
  customer_id: null,
  plate: "ABC1D23",
  brand: "Volkswagen",
  model: "Gol 1.0 MPI",
  year: 2019,
  color: "Prata",
  mileage: 85432,
  fuel_level: "half",
  owner_name: "Carlos Eduardo da Silva",
  owner_document: "52998224725",
  owner_phone: "11987654321",
  owner_whatsapp: "11987654321",
  inspector_id: "00000000-0000-0000-0000-00000000000b",
  inspector_name: "Ana Paula Recepção",
  mechanic_id: null,
  mechanic_name: "João Mecânico",
  notes: "Cliente relata ruído na suspensão dianteira ao passar em lombadas. Solicitou revisão dos freios.",
  checklist_confirmed: true,
  started_at: "2026-11-09T12:10:00Z",
  updated_at: "2026-11-09T12:31:00Z",
  finalized_at: "2026-11-09T12:31:00Z",
  finalized_by: "00000000-0000-0000-0000-00000000000b",
};

const items: Tables<"inspection_items">[] = LABELS.map(([key, label, group], idx) => ({
  inspection_id: inspection.id,
  item_key: key,
  item_label: label,
  group_name: group,
  position: (idx + 1) * 10,
  status: key === "front_bumper" || key === "mirrors" ? "damaged" : key === "personal_items" ? "not_applicable" : "ok",
  notes:
    key === "front_bumper"
      ? "Risco profundo de aprox. 10 cm no canto direito."
      : key === "mirrors"
        ? "Capa do retrovisor esquerdo trincada."
        : key === "warning_lights"
          ? "Luz de injeção acesa."
          : null,
  updated_at: inspection.updated_at,
}));

describe("relatório PDF", () => {
  it("gera PDF com dados, checklist, avarias e fotos", async () => {
    const dir = process.env.PDF_SAMPLE_DIR;
    const img = (name: string) => (dir ? readFileSync(`${dir}/${name}`) : null);
    const photos: ReportPhoto[] = [
      { id: "p1", category: "front", item_key: null, data: img("photo_8a8f99.jpg") },
      { id: "p2", category: "rear", item_key: null, data: img("photo_5a6170.jpg") },
      { id: "p3", category: "dashboard", item_key: null, data: img("photo_b8bcc4.jpg") },
      { id: "p4", category: "damage", item_key: "front_bumper", data: img("photo_8a8f99.jpg") },
    ].filter((p) => p.data) as ReportPhoto[];

    const element = createElement(InspectionReport, {
      inspection,
      items,
      photos,
      generatedAt: new Date("2026-11-09T12:35:00Z"),
    }) as unknown as ReactElement<DocumentProps>;
    const pdf = await renderToBuffer(element);

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(5000);
    if (dir) writeFileSync(`${dir}/relatorio-exemplo.pdf`, pdf);
  }, 30000);
});
