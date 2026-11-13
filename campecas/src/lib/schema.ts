import { chapters, isPlaceholder, site } from "@/content/site";
import { hasWhatsApp } from "@/lib/whatsapp";
import { siteUrl } from "@/lib/site-url";

/**
 * JSON-LD schema.org/AutoRepair montado a partir de site.ts.
 * Campos que ainda são placeholder ficam de fora, para não publicar
 * "[ENDEREÇO]" como dado estruturado.
 */
export function autoRepairSchema() {
  const sameAs = isPlaceholder(site.instagram)
    ? []
    : [`https://www.instagram.com/${site.instagram.replace(/^@/, "")}`];

  const telephones = [site.phone.number, hasWhatsApp ? `+${site.whatsapp.number}` : null].filter(
    (value): value is string => Boolean(value),
  );

  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": `${siteUrl}/#oficina`,
    name: site.fullName,
    alternateName: site.name,
    description: site.description,
    slogan: site.tagline,
    url: siteUrl,
    image: `${siteUrl}/media/og.jpg`,
    logo: `${siteUrl}/logo.svg`,
    telephone: telephones[0],
    ...(telephones.length > 1 && {
      contactPoint: telephones.map((telephone) => ({
        "@type": "ContactPoint",
        telephone,
        contactType: "customer service",
        areaServed: "BR-DF",
        availableLanguage: "pt-BR",
      })),
    }),
    address: {
      "@type": "PostalAddress",
      ...(!isPlaceholder(site.address) && { streetAddress: site.address }),
      addressRegion: site.region,
      addressCountry: "BR",
    },
    areaServed: { "@type": "AdministrativeArea", name: "Distrito Federal" },
    ...(!isPlaceholder(site.hours) && { openingHours: site.hours }),
    ...(sameAs.length > 0 && { sameAs }),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços",
      itemListElement: chapters.items.map((chapter) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: chapter.title, description: chapter.text },
      })),
    },
  };
}

/** Serializa JSON-LD com segurança para dentro de uma <script>. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
