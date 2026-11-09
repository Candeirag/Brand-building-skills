/** Símbolo e nome do produto. A fonte da marca (condensada itálica) fica restrita ao logotipo. */
export function Logo({ size = "md", subtitle = "Check-in" }: { size?: "sm" | "md" | "lg"; subtitle?: string | null }) {
  const s = {
    sm: { word: "text-lg", mark: "h-7 w-7" },
    md: { word: "text-xl", mark: "h-8 w-8" },
    lg: { word: "text-3xl", mark: "h-11 w-11" },
  }[size];
  return (
    <span className="inline-flex items-center gap-2.5 select-none" aria-label="CAMPEÇAS CHECK-IN">
      <LogoMark className={s.mark} />
      <span className="flex flex-col leading-none">
        <span className={`font-brand font-bold tracking-tight text-ink uppercase italic ${s.word}`}>Campeças</span>
        {subtitle && <span className="mt-0.5 text-xs font-medium text-muted">{subtitle}</span>}
      </span>
    </span>
  );
}

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`flex-none ${className}`} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#e10600" />
      <path d="M14 40 L26 18 H50 L44 28 H32 L28 36 H40 L34 46 H14 Z" fill="#fff" />
      <path d="M38 46 L52 22" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
