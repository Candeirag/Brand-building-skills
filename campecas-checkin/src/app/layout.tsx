import type { Metadata, Viewport } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Check-in MineiroCar", template: "%s · Check-in MineiroCar" },
  description: "Inspeção digital de entrada de veículos da MineiroCar Auto Center.",
  applicationName: "Check-in MineiroCar",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Check-in", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f8fb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={barlow.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
