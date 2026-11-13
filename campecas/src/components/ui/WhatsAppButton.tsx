import { whatsappUrl } from "@/lib/whatsapp";
import { ArrowIcon, WhatsAppIcon } from "./icons";

type WhatsAppButtonProps = {
  children: React.ReactNode;
  /** Mensagem pré-preenchida na conversa. */
  message?: string;
  className?: string;
};

/** Props de link para o WhatsApp (ou para #contato enquanto o número for placeholder). */
export function whatsappLinkProps(message?: string) {
  const href = whatsappUrl(message);
  const external = href.startsWith("http");
  return {
    href,
    external,
    ...(external && { target: "_blank", rel: "noopener noreferrer" }),
  };
}

/** CTA principal do site. */
export function WhatsAppButton({ children, message, className = "" }: WhatsAppButtonProps) {
  const { external, ...link } = whatsappLinkProps(message);
  return (
    <a
      {...link}
      className={`group relative inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden bg-red px-6 py-4 text-sm font-semibold tracking-[0.12em] whitespace-nowrap text-bone uppercase transition-transform duration-300 ease-cine active:scale-[0.98] ${className}`}
    >
      <span className="btn-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-bone/25" aria-hidden="true" />
      <WhatsAppIcon className="relative size-5 shrink-0" />
      <span className="relative">{children}</span>
      <ArrowIcon className="relative size-4 shrink-0 transition-transform duration-500 ease-cine group-hover:translate-x-1.5" />
      {external && <span className="sr-only"> (abre o WhatsApp em nova aba)</span>}
    </a>
  );
}
