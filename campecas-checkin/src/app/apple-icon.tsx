import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#e10600" />
          <path d="M14 40 L26 18 H50 L44 28 H32 L28 36 H40 L34 46 H14 Z" fill="#fff" />
          <path d="M38 46 L52 22" stroke="#0b0b0c" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
