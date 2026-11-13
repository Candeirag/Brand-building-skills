type IconProps = { className?: string };

/** Glifo do WhatsApp (balão + fone), desenhado para o site. */
export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true" focusable="false">
      <path
        d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 7.9c-.4 0-.8.4-1 1-.3 1.2.3 2.800 1.900 4.400 1.6 1.6 3.200 2.200 4.400 1.900.6-.2 1-.6 1-1l-.1-1-1.800-.8-.800.9c-.800-.3-1.800-1.300-2.100-2.100l.9-.8-.8-1.800-1-.100Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true" focusable="false">
      <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true" focusable="false">
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}
