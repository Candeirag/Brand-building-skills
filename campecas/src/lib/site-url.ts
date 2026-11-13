/**
 * URL pública do site, usada em metadata, sitemap, robots e JSON-LD.
 * Ordem: NEXT_PUBLIC_SITE_URL (defina na Vercel quando tiver domínio próprio)
 * → domínio de produção da Vercel → localhost.
 */
const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl = (
  fromEnv || (fromVercel ? `https://${fromVercel}` : "http://localhost:3000")
).replace(/\/$/, "");
