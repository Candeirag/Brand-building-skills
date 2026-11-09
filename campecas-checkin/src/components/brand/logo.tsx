import { BRAND_DARK, BRAND_RED, LOGO_VIEWBOX, MARK_PATHS, MARK_VIEWBOX, WORD_PATHS } from "@/lib/brand";

/**
 * Logo original da CAMPEÇAS.
 * tone="light": para fundos claros (palavra no grafite da marca).
 * tone="dark": para fundos escuros (palavra em branco, como no arquivo original).
 */
export function Logo({
  tone = "light",
  height = 28,
  subtitle,
  className = "",
}: {
  tone?: "light" | "dark";
  height?: number;
  subtitle?: string | null;
  className?: string;
}) {
  const word = tone === "dark" ? "#FFFFFF" : BRAND_DARK;
  return (
    <span className={`inline-flex flex-col items-start gap-1 select-none ${className}`}>
      <svg
        viewBox={LOGO_VIEWBOX.join(" ")}
        height={height}
        width={(height * LOGO_VIEWBOX[2]) / LOGO_VIEWBOX[3]}
        role="img"
        aria-label="CAMPEÇAS"
        className="block flex-none"
      >
        {MARK_PATHS.map((d, i) => (
          <path key={`m${i}`} d={d} fill={BRAND_RED} />
        ))}
        {WORD_PATHS.map((d, i) => (
          <path key={`w${i}`} d={d} fill={word} />
        ))}
      </svg>
      {subtitle && (
        <span className={`text-xs font-medium ${tone === "dark" ? "text-white/70" : "text-muted"}`}>{subtitle}</span>
      )}
    </span>
  );
}

/** Símbolo da marca (pistão), para espaços pequenos: barra do celular, ícone do app. */
export function LogoMark({ height = 24, className = "" }: { height?: number; className?: string }) {
  return (
    <svg
      viewBox={MARK_VIEWBOX.join(" ")}
      height={height}
      width={(height * MARK_VIEWBOX[2]) / MARK_VIEWBOX[3]}
      aria-hidden="true"
      className={`block flex-none ${className}`}
    >
      {MARK_PATHS.map((d, i) => (
        <path key={i} d={d} fill={BRAND_RED} />
      ))}
    </svg>
  );
}
