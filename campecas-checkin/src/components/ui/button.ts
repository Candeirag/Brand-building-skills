type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

/*
 * Um único estilo preenchido (o vermelho da marca), usado uma vez por tela.
 * Secundário: branco com borda de 1 px. Terciário: texto.
 * Alturas: 32 / 36 no desktop; 44 para alvos de toque no celular.
 */
const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition active:translate-y-px disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-3";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-ink focus-visible:ring-accent/30",
  outline: "border border-control bg-surface text-ink hover:border-faint focus-visible:ring-ink/10",
  ghost: "text-ink hover:bg-raised focus-visible:ring-ink/10",
  danger: "border border-control bg-surface text-accent-ink hover:border-accent focus-visible:ring-accent/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-4 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}
