/** Colunas usadas nas listagens de inspeções. */
export const INSPECTION_LIST_COLUMNS =
  "id, number, status, plate, brand, model, color, mileage, owner_name, inspector_name, started_at, finalized_at, updated_at" as const;

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
