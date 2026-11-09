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
  title: { default: "CAMPEÇAS CHECK-IN", template: "%s · CAMPEÇAS CHECK-IN" },
  description: "Inspeção digital de entrada de veículos da oficina CAMPEÇAS.",
  applicationName: "CAMPEÇAS CHECK-IN",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Check-in", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f8",
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
