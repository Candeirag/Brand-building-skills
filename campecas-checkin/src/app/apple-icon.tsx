import { ImageResponse } from "next/og";
import { BRAND_DEEP, BRAND_RED, LOGO_LAYERS, MARK_VIEWBOX } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone da tela inicial (iOS): símbolo da MineiroCar (carro com a chave) sobre o azul-escuro da marca. */
export default function AppleIcon() {
  const w = 148;
  const h = Math.round((w * MARK_VIEWBOX[3]) / MARK_VIEWBOX[2]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_DEEP }}>
        <svg width={w} height={h} viewBox={MARK_VIEWBOX.join(" ")}>
          <path d={LOGO_LAYERS.mark} fill={BRAND_RED} />
        </svg>
      </div>
    ),
    size,
  );
}
