import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { services } from '../config/siteConfig';
import { requestService } from '../state/bookingStore';
import { Heading } from './Heading';
import { ServiceVisual } from './ServiceVisual';

export function Services() {
  const [active, setActive] = useState(0);

  return (
    <section id="remap" aria-labelledby="servicos-titulo" className="gutter pb-[120px] pt-[140px] lg:pb-[200px] lg:pt-[220px]">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <Heading
          id="servicos-titulo"
          lines={['Seis formas de', 'extrair mais.']}
          className="text-[clamp(40px,10.5vw,64px)] lg:col-span-8 lg:text-[clamp(64px,7.4vw,136px)]"
        />
        <p data-reveal className="max-w-[26em] text-[17px] text-ink lg:col-span-4 lg:pb-3 lg:text-[19px]">
          Do primeiro diagnóstico ao projeto completo. Todo ajuste começa numa leitura e termina
          numa curva medida.
        </p>
      </div>

      <div className="mt-14 grid gap-10 lg:mt-24 lg:grid-cols-12">
        <ol className="lg:col-span-7">
          {services.map((service, index) => {
            const open = active === index;
            return (
              <li
                key={service.id}
                data-reveal
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                className={`group -mx-[var(--gutter)] px-[var(--gutter)] py-7 transition-colors duration-500 lg:mx-0 lg:px-8 lg:py-9 ${
                  open ? 'lg:bg-graphite' : ''
                }`}
              >
                {/* No celular, cada serviço traz a própria imagem. */}
                <div className="mb-6 aspect-[16/11] lg:hidden">
                  <ServiceVisual visual={service.visual} />
                </div>
                <div className="flex items-baseline gap-5 lg:gap-8">
                  <span
                    className={`num text-[15px] transition-colors duration-500 lg:text-[17px] ${
                      open ? 'text-accent' : 'text-tech'
                    }`}
                    aria-hidden="true"
                  >
                    {service.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="display text-[clamp(30px,8vw,44px)] lg:text-[clamp(38px,3.9vw,68px)]">
                      {service.title}
                    </h3>
                    <p className="mt-3 max-w-[30em] text-[16px] text-ink lg:text-[18px]">
                      {service.description}
                    </p>
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        open
                          ? 'lg:grid-rows-[1fr] lg:opacity-100'
                          : 'lg:grid-rows-[0fr] lg:opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <ul className="mt-5 space-y-[6px] text-[15px] text-ink/80 lg:text-[16px]">
                          {service.details.map((detail) => (
                            <li key={detail} className="flex gap-3">
                              <span className="mt-[0.62em] h-[5px] w-[5px] shrink-0 bg-accent" aria-hidden="true" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={() => requestService(service.title)}
                          tabIndex={open ? 0 : -1}
                          className="link mt-6 inline-flex items-center gap-3 font-display text-[14px] font-semibold uppercase tracking-[0.08em] text-ink"
                        >
                          Agendar {service.title}
                          <ArrowRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* No desktop, um painel fixo troca de imagem conforme o serviço em foco. */}
        <div className="hidden lg:col-span-5 lg:block">
          <div data-reveal className="sticky top-[calc(var(--header-h)+32px)] h-[min(74vh,680px)]">
            {services.map((service, index) => (
              <div
                key={service.id}
                aria-hidden={active !== index}
                className={`absolute inset-0 transition-[clip-path,opacity] duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                  active === index
                    ? 'z-10 opacity-100 [clip-path:inset(0_0_0_0)]'
                    : 'opacity-0 [clip-path:inset(0_0_100%_0)]'
                }`}
              >
                <ServiceVisual visual={service.visual} active={active === index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
