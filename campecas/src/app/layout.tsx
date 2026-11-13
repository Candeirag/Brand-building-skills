import type { Metadata, Viewport } from "next";
import { Anton, Inter_Tight } from "next/font/google";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const title = "Campeças – Lanternagem, Pintura e Mecânica no DF";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Campeças",
  },
  description: site.description,
  applicationName: site.fullName,
  keywords: [
    "lanternagem DF",
    "pintura automotiva DF",
    "funilaria e pintura Brasília",
    "oficina mecânica DF",
    "martelinho de ouro",
    "polimento automotivo",
    "peças automotivas DF",
    "Campeças",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: site.fullName,
    title,
    description: site.description,
    images: [
      {
        url: "/media/og.jpg",
        width: 1200,
        height: 630,
        alt: "Campeças – Do amassado ao espelhado. Lanternagem, pintura e mecânica no DF.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: ["/media/og.jpg"],
  },
  robots: { index: true, follow: true },
  category: "automotive",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${interTight.variable}`}>
      <body>{children}</body>
    </html>
  );
}
