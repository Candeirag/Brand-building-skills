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
