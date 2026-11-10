import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/saira/wdth.css';
import '@fontsource-variable/saira/wdth-italic.css';
import './styles/globals.css';
import { inject } from '@vercel/analytics';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { brand } from './config/siteConfig';

const root = document.documentElement;
root.style.setProperty('--brand-accent', brand.colors.accent);
root.style.setProperty('--brand-accent-deep', brand.colors.accentDeep);
root.style.setProperty('--brand-on-accent', brand.colors.onAccent);
root.style.setProperty('--brand-ink', brand.colors.ink);
root.style.setProperty('--brand-display', brand.type.display);
root.style.setProperty('--brand-display-style', brand.type.italic ? 'italic' : 'normal');
root.style.setProperty('--brand-display-stretch', `${brand.type.stretch}%`);
root.style.setProperty('--brand-display-weight', String(brand.type.weight));
root.style.setProperty('--brand-display-tracking', brand.type.tracking);
root.dataset.brand = brand.id;
if (brand.type.metallic) root.dataset.metallic = 'true';
const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
if (icon) {
  icon.type = brand.logoImage ? 'image/png' : 'image/svg+xml';
  icon.href = brand.logoImage ? 'favicon.png' : 'favicon.svg';
}
document.title = `${brand.name} — Remap e dinamômetro`;

// Contagem de visitas da Vercel (Web Analytics): sem cookies e sem dados
// pessoais. Só registra algo quando o Web Analytics está ligado no projeto.
inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
