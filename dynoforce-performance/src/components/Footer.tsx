import { carConfig } from '../config/carConfig';
import { scrollToTarget } from '../animations/scrollAnimations';
import { brand, navLinks, whatsappUrl } from '../config/siteConfig';

export function Footer() {
  const { credit } = carConfig;
  // O nome volta em largura total: o tamanho é calculado pelo número de letras.
  const letters = brand.wordmark.primary.length;

  return (
    <footer className="bg-graphite pt-16 lg:pt-24">
      <div className="gutter grid gap-10 lg:grid-cols-12">
        <p className="max-w-[22em] text-[20px] leading-[1.35] text-ink lg:col-span-5 lg:text-[24px]">
          {brand.closing}
        </p>
        <nav aria-label="Rodapé" className="lg:col-span-3 lg:col-start-7">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToTarget(link.id === 'inicio' ? 0 : `#${link.id}`);
                  }}
                  className="link font-display text-[15px] font-medium tracking-[0.06em] text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-2 text-[16px] text-ink lg:col-span-3">
          <p>
            <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="link">
              WhatsApp
            </a>
          </p>
          {brand.contact.instagram && (
            <p>
              <a href={brand.contact.instagram.url} target="_blank" rel="noreferrer" className="link">
                Instagram {brand.contact.instagram.handle}
              </a>
            </p>
          )}
          <p className="text-ink/70">
            {brand.contact.address}
            <br />
            {brand.contact.city}
          </p>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="display mt-14 select-none whitespace-nowrap text-center leading-[0.8] text-ink lg:mt-20"
        data-wordmark
        style={{ fontSize: `${(100 / letters) * (brand.type.italic ? 1.3 : 1.46)}vw` }}
      >
        <span className="metal inline-block">{brand.wordmark.primary}</span>
      </p>

      <div className="gutter mt-10 flex flex-col gap-3 pb-24 text-[13px] leading-[1.5] text-ink/60 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:pb-8 lg:pr-[84px]">
        <p className="max-w-[38em]">
          Os valores de potência, torque, boost e os resultados exibidos neste site são ilustrativos
          e servem como demonstração. Não são medições reais. Modelo 3D:{' '}
          <a href={credit.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
            {credit.title}
          </a>
          , por {credit.author}, licença {credit.license}.
        </p>
        <p className="shrink-0">
          © {new Date().getFullYear()} {brand.name}
        </p>
      </div>
    </footer>
  );
}
