import type { Enums } from "./supabase/database.types";

export type PhotoCategory = Enums<"photo_category">;

export const PHOTO_BUCKET = "inspection-photos";

export const PHOTO_CATEGORIES: {
  value: PhotoCategory;
  label: string;
  hint: string;
  /** Obrigatória para finalizar (espelha finalize_inspection no banco). */
  required: boolean;
  recommended: boolean;
}[] = [
  { value: "front", label: "Frente do veículo", hint: "Enquadre o para-choque e a placa", required: true, recommended: true },
  { value: "rear", label: "Traseira", hint: "Inclua a placa traseira", required: false, recommended: true },
  { value: "left_side", label: "Lateral esquerda", hint: "Lado do motorista, inteiro", required: false, recommended: true },
  { value: "right_side", label: "Lateral direita", hint: "Lado do passageiro, inteiro", required: false, recommended: true },
  { value: "dashboard", label: "Painel e quilometragem", hint: "Hodômetro e luzes legíveis", required: true, recommended: true },
  { value: "damage", label: "Avarias", hint: "Uma foto de cada item avariado é obrigatória", required: false, recommended: false },
  { value: "extra", label: "Fotografias adicionais", hint: "Qualquer outro registro", required: false, recommended: false },
];

export function photoCategoryLabel(value: PhotoCategory): string {
  return PHOTO_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const MAX_PHOTO_DIMENSION = 1920;
export const PHOTO_QUALITY = 0.82;
