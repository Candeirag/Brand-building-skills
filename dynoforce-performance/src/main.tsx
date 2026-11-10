import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { brand } from './config/siteConfig';

const root = document.documentElement;
root.style.setProperty('--brand-accent', brand.colors.accent);
root.style.setProperty('--brand-accent-deep', brand.colors.accentDeep);
root.style.setProperty('--brand-on-accent', brand.colors.onAccent);
document.title = `${brand.name} — Remap e dinamômetro`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
