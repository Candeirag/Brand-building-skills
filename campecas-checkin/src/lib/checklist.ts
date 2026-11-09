import type { Enums } from "./supabase/database.types";

export type ChecklistStatus = Enums<"checklist_status">;
export type FuelLevel = Enums<"fuel_level">;

export const CHECKLIST_STATUS: Record<ChecklistStatus, { label: string; short: string }> = {
  ok: { label: "Normal", short: "Normal" },
  damaged: { label: "Avariado", short: "Avariado" },
  not_checked: { label: "Não verificado", short: "Não verif." },
  not_applicable: { label: "Não se aplica", short: "N/A" },
};

export const CHECKLIST_STATUS_ORDER: ChecklistStatus[] = ["ok", "damaged", "not_checked", "not_applicable"];

export const FUEL_LEVELS: { value: FuelLevel; label: string; fraction: number }[] = [
  { value: "reserve", label: "Reserva", fraction: 0.05 },
  { value: "quarter", label: "1/4", fraction: 0.25 },
  { value: "half", label: "1/2", fraction: 0.5 },
  { value: "three_quarters", label: "3/4", fraction: 0.75 },
  { value: "full", label: "Cheio", fraction: 1 },
];

export function fuelLabel(value: FuelLevel | null | undefined): string {
  return FUEL_LEVELS.find((f) => f.value === value)?.label ?? "–";
}

export type ChecklistItemState = {
  item_key: string;
  item_label: string;
  group_name: string;
  position: number;
  status: ChecklistStatus | null;
  notes: string | null;
};

export function groupItems<T extends { group_name: string; position: number }>(items: T[]) {
  const groups = new Map<string, T[]>();
  [...items]
    .sort((a, b) => a.position - b.position)
    .forEach((item) => {
      const list = groups.get(item.group_name) ?? [];
      list.push(item);
      groups.set(item.group_name, list);
    });
  return [...groups.entries()].map(([name, list]) => ({ name, items: list }));
}

export function checklistProgress(items: Pick<ChecklistItemState, "status" | "notes">[]) {
  const answered = items.filter((i) => i.status !== null).length;
  const damaged = items.filter((i) => i.status === "damaged").length;
  const damagedWithoutNotes = items.filter((i) => i.status === "damaged" && !i.notes?.trim()).length;
  return {
    total: items.length,
    answered,
    damaged,
    damagedWithoutNotes,
    complete: items.length > 0 && answered === items.length && damagedWithoutNotes === 0,
  };
}
