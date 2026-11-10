import Image from "next/image";
import { LOGO_VIEWBOX, MARK_VIEWBOX, WORDMARK_VIEWBOX } from "@/lib/brand";

/*
 * Logo da MINEIROCAR Auto Center (SVGs estáticos em /public, guardados em cache pelo navegador).
 * variant="full": carro sobre o nome, para espaços com altura (login, laudo, menu lateral).
 * variant="horizontal": só MINEIROCAR + AUTO CENTER, para faixas baixas.
 * tone="dark": para fundos escuros ("MINEIRO" e "AUTO CENTER" em branco; o vermelho se mantém).
 */
const SOURCES = {
  full: { light: "/logo-mineirocar.svg", dark: "/logo-mineirocar-escuro.svg", box: LOGO_VIEWBOX },
  horizontal: {
    light: "/logo-mineirocar-horizontal.svg",
    dark: "/logo-mineirocar-horizontal-escuro.svg",
    box: WORDMARK_VIEWBOX,
  },
} as const;

export const BRAND_NAME = "MINEIROCAR Auto Center";

export function Logo({
  variant = "full",
  tone = "light",
  height = 56,
  subtitle,
  className = "",
  priority = false,
}: {
  variant?: keyof typeof SOURCES;
  tone?: "light" | "dark";
  height?: number;
  subtitle?: string | null;
  className?: string;
  priority?: boolean;
}) {
  const src = SOURCES[variant];
  const width = Math.round((height * src.box[2]) / src.box[3]);
  return (
    <span className={`inline-flex flex-col items-start gap-1.5 select-none ${className}`}>
      <Image
        src={src[tone]}
        alt={BRAND_NAME}
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className="block flex-none"
        style={{ width, height }}
      />
      {subtitle && (
        <span className={`text-xs font-medium ${tone === "dark" ? "text-white/70" : "text-muted"}`}>{subtitle}</span>
      )}
    </span>
  );
}

/** Símbolo da marca (carro com a chave), para espaços pequenos: barra do celular, página de erro. */
export function LogoMark({ height = 24, className = "" }: { height?: number; className?: string }) {
  const width = Math.round((height * MARK_VIEWBOX[2]) / MARK_VIEWBOX[3]);
  return (
    <Image
      src="/simbolo-mineirocar.svg"
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      unoptimized
      className={`block flex-none ${className}`}
      style={{ width, height }}
    />
  );
}
