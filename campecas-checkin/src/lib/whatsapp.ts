import { formatDate, formatPlate, formatTime } from "./format";
import { onlyDigits } from "./validation";
import { WORKSHOP } from "./workshop";

/**
 * Normaliza um telefone brasileiro para o wa.me: só dígitos, com DDI 55 e DDD.
 * Aceita "(61) 99864-9037", "061998649037", "+55 61 99864-9037". Retorna null se não der para usar.
 */
export function normalizeWhatsappNumber(raw: string | null | undefined): string | null {
  let d = onlyDigits(raw).replace(/^0+/, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  if (!/^[1-9]{2}/.test(d)) return null;
  return `55${d}`;
}

/** WhatsApp cadastrado ou, se não houver, o telefone. */
export function pickContactNumber(whatsapp: string | null | undefined, phone: string | null | undefined): string | null {
  return normalizeWhatsappNumber(whatsapp) ?? normalizeWhatsappNumber(phone);
}

export function reportMessage(input: {
  ownerName: string | null;
  brand: string | null;
  model: string | null;
  plate: string | null;
  registeredAt: string;
  link: string;
}): string {
  const name = input.ownerName?.trim().split(/\s+/)[0] || "tudo bem";
  const vehicle = [input.brand, input.model].filter(Boolean).join(" ") || "veículo";
  return (
    `Olá, ${name}! Aqui é da ${WORKSHOP.name}. Segue o laudo de entrada do seu ${vehicle}, ` +
    `placa ${formatPlate(input.plate)}, registrado em ${formatDate(input.registeredAt)} às ${formatTime(input.registeredAt)}: ${input.link}`
  );
}

export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
