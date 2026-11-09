import { ImageResponse } from "next/og";
import { MARK_PATHS, MARK_VIEWBOX } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone da tela inicial (iOS): símbolo da logo original sobre o grafite da marca. */
export default function AppleIcon() {
  const w = 140;
  const h = Math.round((w * MARK_VIEWBOX[3]) / MARK_VIEWBOX[2]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#231F20" }}>
        <svg width={w} height={h} viewBox={MARK_VIEWBOX.join(" ")}>
          {MARK_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#BF1A2C" />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}
