type LogoProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
};

const sizes = {
  sm: { word: "text-xl", tag: "text-[9px]", mark: "h-6 w-6" },
  md: { word: "text-2xl", tag: "text-[10px]", mark: "h-8 w-8" },
  lg: { word: "text-4xl", tag: "text-xs", mark: "h-11 w-11" },
};

/** Marca CAMPEÇAS CHECK-IN */
export function Logo({ variant = "light", size = "md", showTagline = true }: LogoProps) {
  const s = sizes[size];
  const text = variant === "light" ? "text-white" : "text-ink";
  return (
    <span className="inline-flex items-center gap-2.5 select-none" aria-label="CAMPEÇAS CHECK-IN">
      <LogoMark className={s.mark} />
      <span className="flex flex-col leading-none">
        <span className={`display font-extrabold italic ${s.word} ${text}`}>
          Camp<span className="text-brand-red">e</span>ças
        </span>
        {showTagline && (
          <span className={`display mt-0.5 font-semibold tracking-[0.32em] ${s.tag} ${variant === "light" ? "text-white/60" : "text-steel"}`}>
            Check-in
          </span>
        )}
      </span>
    </span>
  );
}

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#e10600" />
      <path d="M14 40 L26 18 H50 L44 28 H32 L28 36 H40 L34 46 H14 Z" fill="#fff" />
      <path d="M38 46 L52 22" stroke="#0b0b0c" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
