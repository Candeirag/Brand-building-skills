import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { lockScroll, scrollToTarget } from '../animations/scrollAnimations';
import { brand, navLinks, whatsappUrl } from '../config/siteConfig';
import { Logo } from './Logo';

export function Header() {
  const [solid, setSolid] = useState(false);
  const [active, setActive] = useState<string>('inicio');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Seção ativa: a que cruza a linha do meio da tela.
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      lockScroll(false);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    // Espera o menu liberar a rolagem antes de navegar.
    window.setTimeout(() => scrollToTarget(id === 'inicio' ? 0 : `#${id}`), open ? 60 : 0);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-colors duration-500 ${
          solid || open ? 'bg-void' : 'bg-transparent'
        }`}
      >
        <div className="gutter flex h-full items-center justify-between gap-6">
          <a
            href="#inicio"
            onClick={(event) => {
              event.preventDefault();
              go('inicio');
            }}
            aria-label={`${brand.name} — início`}
            className="text-ink"
          >
            <Logo />
          </a>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-7 xl:gap-9">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      go(link.id);
                    }}
                    aria-current={active === link.id ? 'true' : undefined}
                    className={`link font-display text-[13px] font-medium tracking-[0.09em] transition-colors duration-300 ${
                      active === link.id ? 'text-ink' : 'text-ink/65 hover:text-ink'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => go('contato')}
              className="btn btn-primary hidden !min-h-[44px] !px-5 !text-[13px] sm:inline-flex"
            >
              Agendar sessão
            </button>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              className="flex h-11 w-11 items-center justify-center bg-ink/10 text-ink transition-colors hover:bg-ink hover:text-void lg:hidden"
            >
              {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu de tela cheia (celular e tablet) */}
      <div
        id="menu-mobile"
        inert={!open}
        className={`fixed inset-0 z-40 flex flex-col justify-between bg-void gutter pb-8 pt-[calc(var(--header-h)+24px)] transition-[clip-path] duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] lg:hidden ${
          open ? '[clip-path:inset(0_0_0_0)]' : '[clip-path:inset(0_0_100%_0)]'
        }`}
      >
        <nav aria-label="Menu">
          <ul>
            {navLinks.map((link, index) => (
              <li key={link.id} className="overflow-hidden">
                <a
                  href={`#${link.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    go(link.id);
                  }}
                  aria-current={active === link.id ? 'true' : undefined}
                  className={`display flex items-baseline gap-4 py-[1.1vh] text-[clamp(34px,9.6vw,64px)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    open ? 'translate-y-0' : 'translate-y-full'
                  } ${active === link.id ? 'text-accent' : 'text-ink'}`}
                  style={{ transitionDelay: open ? `${120 + index * 55}ms` : '0ms' }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => go('contato')} className="btn btn-primary w-full">
            Agendar sessão
          </button>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn btn-ghost w-full">
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
