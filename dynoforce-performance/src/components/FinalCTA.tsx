import { ArrowRight } from 'lucide-react';
import { scrollToTarget } from '../animations/scrollAnimations';
import { whatsappUrl } from '../config/siteConfig';

const LINES = ['Your car.', 'Your power.', 'Your rules.'];

export function FinalCTA() {
  return (
    <section
      aria-labelledby="cta-titulo"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-void"
    >
      <img
        data-parallax
        src="images/render-cta.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover object-[60%_50%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.35)_48%,rgba(5,5,5,0.55)_100%)]"
      />

      <div className="gutter relative pb-12 pt-[160px] lg:pb-20">
        <h2 id="cta-titulo" className="display text-[clamp(50px,14.6vw,96px)] lg:text-[clamp(96px,11.4vw,220px)]">
          {LINES.map((line) => (
            <span key={line} className="-mt-[0.16em] block overflow-hidden pb-[0.07em] pt-[0.16em]">
              <span data-line className="block">
                {line}
              </span>
            </span>
          ))}
        </h2>
        <div data-reveal className="mt-9 flex flex-col gap-3 sm:flex-row lg:mt-12">
          <button type="button" className="btn btn-primary" onClick={() => scrollToTarget('#contato')}>
            Agende seu projeto
            <ArrowRight size={16} className="btn-arrow" aria-hidden="true" />
          </button>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
