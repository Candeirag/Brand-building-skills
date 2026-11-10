import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Check-in MineiroCar",
    short_name: "Check-in",
    description: "Inspeção digital de entrada de veículos da MineiroCar Auto Center",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1c2340",
    theme_color: "#f7f8fb",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
