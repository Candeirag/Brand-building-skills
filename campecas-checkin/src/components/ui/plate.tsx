import { formatPlate } from "@/lib/format";

/** Placa no padrão Mercosul: o objeto que a equipe reconhece de vista. */
export function Plate({ value, size = "md" }: { value: string | null; size?: "sm" | "md" | "lg" }) {
  const cls = {
    sm: "text-[13px] px-1.5 pt-[9px] pb-[2px] w-[5.75rem]",
    md: "text-[15px] px-2 pt-[11px] pb-[3px] w-[6.75rem]",
    lg: "text-[22px] px-3 pt-[15px] pb-[4px] w-[9.75rem]",
  }[size];
  return (
    <span
      className={`relative inline-flex flex-none justify-center overflow-hidden rounded-chip border-[1.5px] border-ink bg-surface id-type leading-none font-bold tracking-wide whitespace-nowrap text-ink ${cls}`}
    >
      <span className="absolute inset-x-0 top-0 h-[24%] bg-plate-band" aria-hidden="true" />
      {value ? formatPlate(value) : "Sem placa"}
    </span>
  );
}
