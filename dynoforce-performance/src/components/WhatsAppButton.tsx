import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { whatsappUrl } from '../config/siteConfig';
import { useIsCompact } from '../hooks/useMediaQuery';

/** Botão flutuante do WhatsApp. No celular só aparece depois do hero, que já tem o próprio CTA. */
export function WhatsAppButton() {
  const compact = useIsCompact();
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('inicio');
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const visible = !compact || pastHero;

  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chamar no WhatsApp"
      tabIndex={visible ? 0 : -1}
      className={`group fixed bottom-4 right-4 z-40 flex h-14 items-center bg-accent text-on-accent transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04] active:scale-95 lg:bottom-6 lg:right-[var(--gutter)] ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <span className="flex h-14 w-14 items-center justify-center">
        <MessageCircle size={24} aria-hidden="true" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-display text-[13px] font-semibold uppercase tracking-[0.08em] transition-[max-width,padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-[140px] group-hover:pr-5 group-focus-visible:max-w-[140px] group-focus-visible:pr-5">
        WhatsApp
      </span>
    </a>
  );
}
