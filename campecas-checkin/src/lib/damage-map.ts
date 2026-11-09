import type { ChecklistStatus } from "./checklist";

/**
 * Mapa de avarias: o croqui da ficha de entrada da oficina, desenhado a partir do checklist.
 * Carro visto de cima, frente para cima. viewBox 0 0 200 360.
 * Cada zona representa um ou mais itens do checklist; a zona assume o pior estado entre eles.
 */

export type ZoneShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; r?: number }
  | { kind: "path"; d: string };

export type MapZone = {
  id: string;
  keys: string[];
  label: string;
  shapes: ZoneShape[];
};

export const MAP_VIEWBOX = { width: 200, height: 360 } as const;

/** Contorno da carroceria (não é zona do checklist). */
export const BODY_PATH =
  "M60 22 Q100 10 140 22 Q158 28 160 52 L162 308 Q160 334 140 340 Q100 350 60 340 Q40 334 38 308 L40 52 Q42 28 60 22 Z";

/** Teto (referência visual, não é zona). */
export const ROOF_RECT = { x: 70, y: 152, w: 60, h: 104, r: 6 } as const;

export const MAP_ZONES: MapZone[] = [
  { id: "front_bumper", keys: ["front_bumper"], label: "Para-choque dianteiro", shapes: [{ kind: "rect", x: 52, y: 8, w: 96, h: 14, r: 7 }] },
  {
    id: "headlights",
    keys: ["headlights"],
    label: "Faróis",
    shapes: [
      { kind: "rect", x: 50, y: 30, w: 26, h: 10, r: 3 },
      { kind: "rect", x: 124, y: 30, w: 26, h: 10, r: 3 },
    ],
  },
  { id: "hood", keys: ["hood"], label: "Capô", shapes: [{ kind: "rect", x: 56, y: 46, w: 88, h: 64, r: 8 }] },
  {
    id: "windows",
    keys: ["windows"],
    label: "Vidros",
    shapes: [
      { kind: "path", d: "M60 118 L140 118 L132 146 L68 146 Z" },
      { kind: "path", d: "M68 262 L132 262 L138 286 L62 286 Z" },
    ],
  },
  {
    id: "mirrors",
    keys: ["mirrors"],
    label: "Retrovisores",
    shapes: [
      { kind: "rect", x: 26, y: 124, w: 14, h: 10, r: 3 },
      { kind: "rect", x: 160, y: 124, w: 14, h: 10, r: 3 },
    ],
  },
  {
    id: "doors",
    keys: ["doors"],
    label: "Portas",
    shapes: [
      { kind: "rect", x: 44, y: 150, w: 20, h: 52, r: 3 },
      { kind: "rect", x: 44, y: 206, w: 20, h: 52, r: 3 },
      { kind: "rect", x: 136, y: 150, w: 20, h: 52, r: 3 },
      { kind: "rect", x: 136, y: 206, w: 20, h: 52, r: 3 },
    ],
  },
  {
    id: "wheels",
    keys: ["wheels", "tires"],
    label: "Rodas e pneus",
    shapes: [
      { kind: "rect", x: 24, y: 66, w: 12, h: 38, r: 4 },
      { kind: "rect", x: 164, y: 66, w: 12, h: 38, r: 4 },
      { kind: "rect", x: 24, y: 252, w: 12, h: 38, r: 4 },
      { kind: "rect", x: 164, y: 252, w: 12, h: 38, r: 4 },
    ],
  },
  { id: "trunk", keys: ["trunk"], label: "Porta-malas", shapes: [{ kind: "rect", x: 56, y: 292, w: 88, h: 34, r: 8 }] },
  {
    id: "taillights",
    keys: ["taillights"],
    label: "Lanternas",
    shapes: [
      { kind: "rect", x: 50, y: 330, w: 26, h: 8, r: 3 },
      { kind: "rect", x: 124, y: 330, w: 26, h: 8, r: 3 },
    ],
  },
  { id: "rear_bumper", keys: ["rear_bumper"], label: "Para-choque traseiro", shapes: [{ kind: "rect", x: 52, y: 340, w: 96, h: 14, r: 7 }] },
];

export const MAPPED_KEYS = new Set(MAP_ZONES.flatMap((z) => z.keys));

export type ZoneState = "damaged" | "pending" | "not_checked" | "ok" | "not_applicable";

const SEVERITY: ZoneState[] = ["damaged", "pending", "not_checked", "ok", "not_applicable"];

/** Estado da zona = o pior entre os itens que ela representa. */
export function zoneState(
  zone: MapZone,
  statusByKey: Record<string, ChecklistStatus | null | undefined>,
): ZoneState {
  const states: ZoneState[] = zone.keys.map((k) => {
    const s = statusByKey[k];
    return s === undefined || s === null ? "pending" : s;
  });
  return SEVERITY.find((s) => states.includes(s)) ?? "pending";
}

/** Cores dos estados (mesmo objeto para as marcas e para a legenda). */
export const ZONE_STYLE: Record<ZoneState, { fill: string; stroke: string; label: string; dashed?: boolean }> = {
  damaged: { fill: "#BF1A2C", stroke: "#8E1424", label: "Avariado" },
  ok: { fill: "#e4dede", stroke: "#c9c2c2", label: "Normal" },
  not_checked: { fill: "#ffffff", stroke: "#6b6b6b", label: "Não verificado", dashed: true },
  not_applicable: { fill: "#f6f2f2", stroke: "#e4dede", label: "Não se aplica" },
  pending: { fill: "#ffffff", stroke: "#d4cfcf", label: "Pendente" },
};
