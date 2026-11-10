import type { ChecklistStatus } from "@/lib/checklist";
import {
  BODY_PATH,
  MAP_VIEWBOX,
  MAP_ZONES,
  ROOF_RECT,
  ZONE_STYLE,
  zoneState,
  type ZoneShape,
  type ZoneState,
} from "@/lib/damage-map";

function Shape({ shape, state }: { shape: ZoneShape; state: ZoneState }) {
  const st = ZONE_STYLE[state];
  const common = {
    fill: st.fill,
    stroke: st.stroke,
    strokeWidth: 1.5,
    strokeDasharray: st.dashed ? "3 2" : undefined,
  };
  if (shape.kind === "rect") {
    return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.r ?? 0} {...common} />;
  }
  return <path d={shape.d} {...common} />;
}

/**
 * Mapa de avarias: silhueta vista de cima com cada zona no estado do checklist.
 * As zonas avariadas levam o vermelho cheio; o resto fica em neutros.
 */
export function DamageMap({
  statusByKey,
  className = "",
  showLegend = true,
}: {
  statusByKey: Record<string, ChecklistStatus | null | undefined>;
  className?: string;
  showLegend?: boolean;
}) {
  const zones = MAP_ZONES.map((z) => ({ zone: z, state: zoneState(z, statusByKey) }));
  const present = new Set(zones.map((z) => z.state));
  const damagedLabels = zones.filter((z) => z.state === "damaged").map((z) => z.zone.label);
  const legendOrder: ZoneState[] = ["damaged", "ok", "not_checked", "not_applicable", "pending"];

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
        role="img"
        aria-label={
          damagedLabels.length ? `Mapa de avarias: ${damagedLabels.join(", ")}` : "Mapa de avarias: nenhuma avaria"
        }
        className="mx-auto block h-auto w-full max-w-[200px]"
      >
        <path d={BODY_PATH} fill="#ffffff" stroke="#d4cfcf" strokeWidth={1.5} />
        <rect x={ROOF_RECT.x} y={ROOF_RECT.y} width={ROOF_RECT.w} height={ROOF_RECT.h} rx={ROOF_RECT.r} fill="#f6f2f2" />
        {zones.map(({ zone, state }) => (
          <g key={zone.id}>
            <title>{`${zone.label}: ${ZONE_STYLE[state].label}`}</title>
            {zone.shapes.map((s, i) => (
              <Shape key={i} shape={s} state={state} />
            ))}
          </g>
        ))}
      </svg>
      {showLegend && (
        <figcaption className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
          {legendOrder
            .filter((s) => present.has(s))
            .map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <svg width="10" height="10" aria-hidden="true">
                  <rect
                    x="0.75"
                    y="0.75"
                    width="8.5"
                    height="8.5"
                    rx="2"
                    fill={ZONE_STYLE[s].fill}
                    stroke={ZONE_STYLE[s].stroke}
                    strokeWidth="1.5"
                    strokeDasharray={ZONE_STYLE[s].dashed ? "2 1.5" : undefined}
                  />
                </svg>
                {ZONE_STYLE[s].label}
              </span>
            ))}
        </figcaption>
      )}
    </figure>
  );
}
