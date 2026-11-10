import type { FuelLevel } from "./checklist";
import { plural } from "./plural";
import { formatDocument, formatNumber, formatPhone } from "./format";
import type { Tables, TablesUpdate } from "./supabase/database.types";
import {
  isValidDocument,
  isValidPhone,
  isValidPlate,
  isValidYear,
  normalizePlate,
  onlyDigits,
} from "./validation";

/** Estado do formulário (valores exibidos nos campos). */
export type InspectionForm = {
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  mileage: string;
  fuel_level: FuelLevel | null;
  owner_name: string;
  owner_document: string;
  owner_phone: string;
  owner_whatsapp: string;
  customer_id: string | null;
  inspector_name: string;
  mechanic_name: string;
  mechanic_id: string | null;
  notes: string;
  service_request: string;
  checklist_confirmed: boolean;
};

export type FormField = keyof InspectionForm;

export function formFromInspection(row: Tables<"inspections">): InspectionForm {
  return {
    plate: row.plate ?? "",
    brand: row.brand ?? "",
    model: row.model ?? "",
    year: row.year ? String(row.year) : "",
    color: row.color ?? "",
    mileage: row.mileage != null ? formatNumber(row.mileage) : "",
    fuel_level: row.fuel_level,
    owner_name: row.owner_name ?? "",
    owner_document: formatDocument(row.owner_document),
    owner_phone: formatPhone(row.owner_phone),
    owner_whatsapp: formatPhone(row.owner_whatsapp),
    customer_id: row.customer_id,
    inspector_name: row.inspector_name ?? "",
    mechanic_name: row.mechanic_name ?? "",
    mechanic_id: row.mechanic_id,
    notes: row.notes ?? "",
    service_request: row.service_request ?? "",
    checklist_confirmed: row.checklist_confirmed,
  };
}

/** Formulário de uma inspeção nova (ainda não gravada no banco). */
export function emptyForm(inspectorName: string, plate = ""): InspectionForm {
  return {
    plate,
    brand: "",
    model: "",
    year: "",
    color: "",
    mileage: "",
    fuel_level: null,
    owner_name: "",
    owner_document: "",
    owner_phone: "",
    owner_whatsapp: "",
    customer_id: null,
    inspector_name: inspectorName,
    mechanic_name: "",
    mechanic_id: null,
    notes: "",
    service_request: "",
    checklist_confirmed: false,
  };
}

const text = (v: string, max: number) => {
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

export function parseMileage(value: string): number | null {
  const d = onlyDigits(value);
  if (!d) return null;
  const n = Number(d);
  return Number.isSafeInteger(n) && n <= 9_999_999 ? n : null;
}

export function parseYear(value: string): number | null {
  const n = Number(onlyDigits(value));
  return isValidYear(n) ? n : null;
}

/**
 * Converte os campos alterados em um patch para o banco. Valores inválidos
 * ou incompletos são gravados como nulos (o rascunho continua no aparelho).
 */
export function toInspectionPatch(form: InspectionForm, fields: Iterable<FormField>): TablesUpdate<"inspections"> {
  const patch: TablesUpdate<"inspections"> = {};
  for (const field of fields) {
    switch (field) {
      case "plate": {
        const p = normalizePlate(form.plate);
        patch.plate = isValidPlate(p) ? p : null;
        break;
      }
      case "brand":
        patch.brand = text(form.brand, 60);
        break;
      case "model":
        patch.model = text(form.model, 80);
        break;
      case "year":
        patch.year = parseYear(form.year);
        break;
      case "color":
        patch.color = text(form.color, 40);
        break;
      case "mileage":
        patch.mileage = parseMileage(form.mileage);
        break;
      case "fuel_level":
        patch.fuel_level = form.fuel_level;
        break;
      case "owner_name":
        patch.owner_name = text(form.owner_name, 160);
        break;
      case "owner_document": {
        const d = onlyDigits(form.owner_document);
        patch.owner_document = isValidDocument(d) ? d : null;
        break;
      }
      case "owner_phone": {
        const d = onlyDigits(form.owner_phone);
        patch.owner_phone = isValidPhone(d) ? d : null;
        break;
      }
      case "owner_whatsapp": {
        const d = onlyDigits(form.owner_whatsapp);
        patch.owner_whatsapp = isValidPhone(d) ? d : null;
        break;
      }
      case "customer_id":
        patch.customer_id = form.customer_id;
        break;
      case "inspector_name":
        patch.inspector_name = text(form.inspector_name, 120);
        break;
      case "mechanic_name":
        patch.mechanic_name = text(form.mechanic_name, 120);
        break;
      case "mechanic_id":
        patch.mechanic_id = form.mechanic_id;
        break;
      case "notes":
        patch.notes = text(form.notes, 5000);
        break;
      case "service_request":
        patch.service_request = text(form.service_request, 2000);
        break;
      case "checklist_confirmed":
        patch.checklist_confirmed = form.checklist_confirmed;
        break;
    }
  }
  return patch;
}

/** Erros de validação exibidos nos campos (somente quando preenchidos). */
export function fieldErrors(form: InspectionForm): Partial<Record<FormField, string>> {
  const errors: Partial<Record<FormField, string>> = {};
  if (form.plate && !isValidPlate(form.plate)) errors.plate = "Placa inválida (ex.: ABC1D23 ou ABC1234)";
  if (form.year && parseYear(form.year) === null) errors.year = "Ano inválido";
  if (form.mileage && parseMileage(form.mileage) === null) errors.mileage = "Quilometragem inválida";
  if (form.owner_document && !isValidDocument(form.owner_document)) errors.owner_document = "CPF/CNPJ inválido";
  if (form.owner_phone && !isValidPhone(form.owner_phone)) errors.owner_phone = "Telefone inválido (inclua o DDD)";
  if (form.owner_whatsapp && !isValidPhone(form.owner_whatsapp)) errors.owner_whatsapp = "WhatsApp inválido (inclua o DDD)";
  return errors;
}

export function vehicleSectionComplete(form: InspectionForm): boolean {
  return (
    isValidPlate(form.plate) && !!form.brand.trim() && !!form.model.trim() && parseMileage(form.mileage) !== null
  );
}

export function ownerSectionComplete(form: InspectionForm): boolean {
  const e = fieldErrors(form);
  return (
    form.owner_name.trim().length >= 2 &&
    (isValidPhone(form.owner_phone) || isValidPhone(form.owner_whatsapp)) &&
    !e.owner_document &&
    !e.owner_phone &&
    !e.owner_whatsapp &&
    form.service_request.trim().length > 0
  );
}

export type PhotoRequirementInput = {
  hasFront: boolean;
  hasDashboard: boolean;
  /** Rótulos dos itens avariados que ainda não têm foto. */
  damagedWithoutPhoto: string[];
};

/** Pendências que impedem a finalização (espelha finalize_inspection no banco). */
export function finalizationIssues(
  form: InspectionForm,
  checklist: { answered: number; total: number; damagedWithoutNotes: number },
  photos: PhotoRequirementInput = { hasFront: true, hasDashboard: true, damagedWithoutPhoto: [] },
): string[] {
  const issues: string[] = [];
  if (!isValidPlate(form.plate)) issues.push("Informe a placa");
  if (!form.brand.trim()) issues.push("Informe a marca");
  if (!form.model.trim()) issues.push("Informe o modelo");
  if (parseMileage(form.mileage) === null) issues.push("Informe a quilometragem");
  if (form.owner_name.trim().length < 2) issues.push("Informe o nome do proprietário");
  if (!isValidPhone(form.owner_phone) && !isValidPhone(form.owner_whatsapp))
    issues.push("Informe um telefone ou WhatsApp válido");
  if (!form.service_request.trim()) issues.push("Descreva o serviço solicitado pelo cliente");
  if (checklist.answered < checklist.total)
    issues.push(`Responda ${plural(checklist.total - checklist.answered, "item do checklist", "itens do checklist")}`);
  if (checklist.damagedWithoutNotes > 0)
    issues.push(`Descreva ${plural(checklist.damagedWithoutNotes, "avaria", "avarias")}`);
  if (!photos.hasFront) issues.push("Fotografe a frente do veículo");
  if (!photos.hasDashboard) issues.push("Fotografe o painel com a quilometragem");
  for (const label of photos.damagedWithoutPhoto) issues.push(`Fotografe a avaria: ${label}`);
  if (!form.inspector_name.trim()) issues.push("Informe o funcionário responsável");
  if (!form.mechanic_name.trim()) issues.push("Informe o mecânico responsável");
  if (!form.checklist_confirmed) issues.push("Confirme que o checklist foi concluído");
  return issues;
}
