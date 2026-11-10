/** "há 42 min", "há 3 h", "há 2 dias": sempre relativo a agora. */
export function elapsed(fromIso: string, now: Date = new Date()): string {
  const min = Math.max(0, Math.round((now.getTime() - new Date(fromIso).getTime()) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h${min % 60 ? ` ${min % 60} min` : ""}`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}

/** Duração legível: "menos de 1 min", "42 min", "3 h 05 min", "2 d 4 h". */
export function formatDuration(ms: number): string {
  const min = Math.floor(Math.max(0, ms) / 60000);
  if (min < 1) return "menos de 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ${String(min % 60).padStart(2, "0")} min`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d} d ${h % 24} h` : `${d} d`;
}
