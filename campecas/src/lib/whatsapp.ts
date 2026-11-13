import { isPlaceholder, site } from "@/content/site";

/** true quando o número do WhatsApp em site.ts já é real. */
export const hasWhatsApp = !isPlaceholder(site.whatsapp.number) && /\d{10,}/.test(site.whatsapp.number);

/**
 * Link de conversa no WhatsApp com mensagem pronta.
 * Enquanto o número for placeholder, leva para a seção de contato
 * em vez de gerar um link quebrado.
 */
export function whatsappUrl(message: string = site.whatsapp.message): string {
  if (!hasWhatsApp) return "#contato";
  const digits = site.whatsapp.number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
