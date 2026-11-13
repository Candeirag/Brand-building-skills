import { whatsappLinkProps } from "./WhatsAppButton";
import { WhatsAppIcon } from "./icons";

/** Botão flutuante de WhatsApp: sempre visível, discreto, com um pulso lento. */
export function WhatsAppFab() {
  const { external, ...link } = whatsappLinkProps();
  return (
    <a
      {...link}
      aria-label={external ? "Orçamento no WhatsApp (abre em nova aba)" : "Ir para o contato"}
      className="group fixed right-(--gutter) bottom-[calc(var(--bar)+env(safe-area-inset-bottom)+0.875rem)] z-50 grid size-13 place-items-center bg-red text-bone shadow-[0_8px_30px_rgb(0_0_0/0.5)] transition-transform duration-500 ease-cine hover:scale-105 active:scale-95"
    >
      <span className="fab-pulse pointer-events-none absolute inset-0 border border-red" aria-hidden="true" />
      <WhatsAppIcon className="relative size-6" />
    </a>
  );
}
