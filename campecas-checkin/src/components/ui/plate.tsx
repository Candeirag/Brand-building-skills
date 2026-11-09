import { formatPlate } from "@/lib/format";

/** Placa estilizada no padrão Mercosul. */
export function Plate({ value, size = "md" }: { value: string | null; size?: "sm" | "md" | "lg" }) {
  const cls = {
    sm: "text-sm px-2 pt-2.5 pb-0.5 min-w-[5.5rem]",
    md: "text-base px-2.5 pt-3 pb-1 min-w-[6.5rem]",
    lg: "text-2xl px-4 pt-4 pb-1.5 min-w-[10rem]",
  }[size];
  return (
    <span
      className={`relative inline-flex shrink-0 justify-center overflow-hidden rounded-md whitespace-nowrap border-2 border-ink bg-white font-mono font-bold tracking-wider text-ink ${cls}`}
    >
      <span className="absolute inset-x-0 top-0 h-[22%] bg-[#1f4fa3]" aria-hidden="true" />
      {value ? formatPlate(value) : "SEM PLACA"}
    </span>
  );
}
