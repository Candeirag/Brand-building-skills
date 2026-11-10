/**
 * Tempo no pátio: da entrada (started_at) até a saída registrada (yard_exits).
 * Acima de YARD_ALERT_HOURS o temporizador fica em destaque (âmbar).
 * Ajuste aqui se a oficina preferir outro limite.
 */
export const YARD_ALERT_HOURS = 72;

export function yardDurationMs(startedAt: string, exitedAt: string | null, nowMs: number): number {
  const end = exitedAt ? new Date(exitedAt).getTime() : nowMs;
  return Math.max(0, end - new Date(startedAt).getTime());
}

export function isOverdue(ms: number): boolean {
  return ms >= YARD_ALERT_HOURS * 3600_000;
}
