import { onlyDigits, normalizePlate } from "./validation";

export const TIME_ZONE = "America/Sao_Paulo";

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const isoDateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const numberFmt = new Intl.NumberFormat("pt-BR");

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "–";
  return dateTimeFmt.format(new Date(value)).replace(",", " às");
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "–";
  return dateFmt.format(new Date(value));
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "–";
  return timeFmt.format(new Date(value));
}

/** Data (AAAA-MM-DD) no fuso de São Paulo. */
export function isoDateInSaoPaulo(value: Date = new Date()): string {
  return isoDateFmt.format(value);
}

/** Início do dia (00:00, horário de Brasília) em ISO, para filtros. */
export function startOfDaySaoPaulo(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00-03:00`).toISOString();
}

export function endOfDaySaoPaulo(isoDate: string): string {
  return new Date(`${isoDate}T23:59:59.999-03:00`).toISOString();
}

export function formatKm(value: number | null | undefined): string {
  if (value == null) return "–";
  return `${numberFmt.format(value)} km`;
}

export function formatNumber(value: number | null | undefined): string {
  return value == null ? "" : numberFmt.format(value);
}

/** ABC1D23 → ABC-1D23 */
export function formatPlate(value: string | null | undefined): string {
  const p = normalizePlate(value);
  if (!p) return "–";
  return p.length > 3 ? `${p.slice(0, 3)}-${p.slice(3)}` : p;
}

export function formatPhone(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function formatDocument(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (!d) return "";
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** LGPD: exibe documento parcialmente: ***.456.789-** / **.345.678/0001-** */
export function maskDocument(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  if (d.length === 14) return `**.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-**`;
  return d ? "***" : "–";
}

/** Link wa.me para WhatsApp (Brasil). */
export function whatsappLink(value: string | null | undefined, text?: string): string | null {
  const d = onlyDigits(value);
  if (d.length < 10) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/55${d}${q}`;
}
