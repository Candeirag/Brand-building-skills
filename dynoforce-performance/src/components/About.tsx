import { brand, brandImage } from '../config/siteConfig';
import { Heading } from './Heading';

export function About() {
  const { about } = brand;
  const words = about.title.replace(/\.$/, '').split(' ');
  const half = Math.ceil(words.length / 2);
  const lines = [words.slice(0, half).join(' '), `${words.slice(half).join(' ')}.`];

  return (
    <section id="sobre" aria-labelledby="sobre-titulo" className="pb-[120px] lg:pb-[200px]">
      <div className="gutter">
        <Heading
          id="sobre-titulo"
          lines={lines}
          className="text-[clamp(30px,8.4vw,60px)] lg:text-[clamp(60px,6.9vw,128px)]"
        />
      </div>

      <div className="relative mt-12 aspect-[4/3] overflow-hidden sm:aspect-[21/9] lg:mt-20">
        <img
          data-parallax
          src={brandImage('render-profile.jpg')}
          alt="O carro visto de lado, preso ao dinamômetro, com a oficina acesa ao fundo."
          loading="lazy"
          className="absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover"
        />
      </div>

      <div className="gutter mt-12 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          {about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              data-reveal
              className={
                index === 0
                  ? 'text-[22px] leading-[1.35] text-ink lg:text-[30px]'
                  : 'mt-6 max-w-[34em] text-[17px] text-ink lg:text-[19px]'
              }
            >
              {paragraph}
            </p>
          ))}

          {about.team && (
            <ul className="mt-12 space-y-8">
              {about.team.map((member) => (
                <li key={member.name} data-reveal>
                  <h3 className="display text-[32px] lg:text-[40px]">{member.name}</h3>
                  <p className="mt-1 font-display text-[14px] font-semibold uppercase tracking-[0.08em] text-accent">
                    {member.role}
                  </p>
                  <p className="mt-3 max-w-[32em] text-[16px] text-ink lg:text-[17px]">{member.bio}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ul className="lg:col-span-6 lg:col-start-7">
          {about.pillars.map((pillar, index) => (
            <li
              key={pillar.title}
              data-reveal
              className={`grid gap-2 py-6 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:items-baseline sm:gap-8 lg:py-7 ${
                index % 2 === 0 ? 'bg-graphite' : ''
              } -mx-[var(--gutter)] px-[var(--gutter)] lg:mx-0 lg:px-8`}
            >
              <h3 className="display text-[30px] lg:text-[clamp(30px,2.8vw,48px)]">{pillar.title}</h3>
              <p className="text-[16px] text-ink lg:text-[17px]">{pillar.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
