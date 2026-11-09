import { describe, expect, it } from "vitest";
import { checklistProgress } from "@/lib/checklist";
import {
  fieldErrors,
  finalizationIssues,
  parseMileage,
  toInspectionPatch,
  type InspectionForm,
} from "@/lib/inspection-form";

const base: InspectionForm = {
  plate: "ABC1D23",
  brand: "Volkswagen",
  model: "Gol",
  year: "2019",
  color: "Prata",
  mileage: "85.432",
  fuel_level: "half",
  owner_name: "Carlos da Silva",
  owner_document: "529.982.247-25",
  owner_phone: "(11) 98765-4321",
  owner_whatsapp: "",
  customer_id: null,
  inspector_name: "Ana",
  mechanic_name: "João",
  mechanic_id: null,
  notes: "",
  service_request: "Revisão dos freios",
  checklist_confirmed: true,
};

describe("conversão para o banco", () => {
  it("normaliza valores", () => {
    const patch = toInspectionPatch(base, ["plate", "mileage", "owner_document", "owner_phone", "year", "notes"]);
    expect(patch).toEqual({
      plate: "ABC1D23",
      mileage: 85432,
      owner_document: "52998224725",
      owner_phone: "11987654321",
      year: 2019,
      notes: null,
    });
  });
  it("grava nulo para valores incompletos", () => {
    const patch = toInspectionPatch(
      { ...base, plate: "ABC1", owner_document: "529.98", owner_phone: "(11) 9" },
      ["plate", "owner_document", "owner_phone"],
    );
    expect(patch).toEqual({ plate: null, owner_document: null, owner_phone: null });
  });
  it("interpreta quilometragem", () => {
    expect(parseMileage("1.234.567")).toBe(1234567);
    expect(parseMileage("")).toBeNull();
  });
});

describe("validação e pendências", () => {
  it("aponta erros de campos preenchidos", () => {
    const errors = fieldErrors({ ...base, owner_document: "111.111.111-11", plate: "XX" });
    expect(errors.owner_document).toBeDefined();
    expect(errors.plate).toBeDefined();
    expect(errors.owner_phone).toBeUndefined();
  });
  it("lista pendências para finalizar", () => {
    const progress = checklistProgress([
      { status: "ok", notes: null },
      { status: "damaged", notes: "" },
      { status: null, notes: null },
    ]);
    expect(progress).toMatchObject({ total: 3, answered: 2, damaged: 1, damagedWithoutNotes: 1, complete: false });
    const issues = finalizationIssues({ ...base, mechanic_name: "", checklist_confirmed: false }, progress);
    expect(issues).toEqual([
      "Responda 1 item do checklist",
      "Descreva 1 avaria",
      "Informe o mecânico responsável",
      "Confirme que o checklist foi concluído",
    ]);
  });
  it("concordância no plural e fotos obrigatórias", () => {
    const progress = checklistProgress([
      { status: null, notes: null },
      { status: null, notes: null },
      { status: "damaged", notes: "" },
      { status: "damaged", notes: "" },
    ]);
    const issues = finalizationIssues({ ...base, service_request: " " }, progress, {
      hasFront: false,
      hasDashboard: false,
      damagedWithoutPhoto: ["Capô"],
    });
    expect(issues).toEqual([
      "Descreva o serviço solicitado pelo cliente",
      "Responda 2 itens do checklist",
      "Descreva 2 avarias",
      "Fotografe a frente do veículo",
      "Fotografe o painel com a quilometragem",
      "Fotografe a avaria: Capô",
    ]);
  });
  it("sem pendências quando completo", () => {
    const progress = checklistProgress([{ status: "ok", notes: null }]);
    expect(finalizationIssues(base, progress)).toEqual([]);
  });
});
