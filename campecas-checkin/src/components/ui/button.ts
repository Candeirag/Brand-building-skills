type Variant = "primary" | "dark" | "outline" | "ghost" | "danger";
type Size = "md" | "lg" | "xl" | "sm";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4";

const variants: Record<Variant, string> = {
  primary: "bg-brand-red text-white shadow-sm hover:bg-brand-red-dark focus-visible:ring-brand-red/30",
  dark: "bg-ink text-white hover:bg-graphite focus-visible:ring-ink/30",
  outline: "border border-line bg-white text-ink hover:border-graphite/40 hover:bg-paper focus-visible:ring-ink/10",
  ghost: "text-graphite hover:bg-black/5 focus-visible:ring-ink/10",
  danger: "border border-brand-red/30 bg-white text-brand-red hover:bg-brand-red-soft focus-visible:ring-brand-red/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-13 px-5 text-base",
  xl: "h-16 px-6 text-lg display tracking-wider",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}
