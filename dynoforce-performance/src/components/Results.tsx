import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { results, type ResultItem } from '../config/siteConfig';
import { Heading } from './Heading';

const gain = (from: number, to: number) => Math.round(((to - from) / from) * 100);

function Metric({ label, unit, from, to }: { label: string; unit: string; from: number; to: number }) {
  return (
    <div>
      <dt className="text-[15px] text-ink/70">{label}</dt>
      <dd className="num mt-2 flex flex-wrap items-baseline gap-x-3 text-[clamp(26px,3vw,46px)] font-medium leading-none tracking-[-0.05em]">
        <span className="text-ink/55">{from}</span>
        <ArrowRight size={20} className="self-center text-accent" aria-label="para" />
        <span className="text-ink">{to}</span>
        <span className="font-display text-[0.42em] font-bold tracking-normal text-ink/60">{unit}</span>
      </dd>
      {/* Barras na mesma escala: original e final. */}
      <dd className="mt-4 space-y-[5px]" aria-hidden="true">
        <div className="h-[6px] bg-ink/30" style={{ width: `${(from / to) * 100}%` }} />
        <div className="h-[6px] bg-accent" />
      </dd>
      <dd className="num mt-3 text-[14px] text-accent">
        +{to - from} {unit} · +{gain(from, to)}%
      </dd>
    </div>
  );
}

function Spread({ item, index }: { item: ResultItem; index: number }) {
  return (
    <article
      aria-label={`${item.model}, ${item.stage}`}
      className={`flex w-[86vw] max-w-[1180px] shrink-0 snap-start flex-col justify-between gap-10 p-6 sm:w-[78vw] lg:min-h-[560px] lg:p-12 ${
        index % 2 === 0 ? 'bg-graphite' : 'bg-steel'
      }`}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="display text-[clamp(38px,6.2vw,104px)]">{item.model}</h3>
          <p className="mt-3 text-[16px] text-ink lg:text-[19px]">
            {item.engine} · {item.stage}
          </p>
        </div>
        <p className="num text-[15px] text-ink/50" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}/{String(results.length).padStart(2, '0')}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <p className="lg:col-span-5">
          <span className="num block text-[clamp(88px,15vw,250px)] font-medium leading-[0.78] tracking-[-0.08em] text-accent">
            +{gain(item.powerBefore, item.powerAfter)}
            <span className="text-[0.4em]">%</span>
          </span>
          <span className="mt-4 block text-[17px] text-ink">
            de potência
          </span>
        </p>
        <dl className="grid gap-9 sm:grid-cols-2 lg:col-span-7">
          <Metric label="Potência" unit="CV" from={item.powerBefore} to={item.powerAfter} />
          <Metric label="Torque" unit="Nm" from={item.torqueBefore} to={item.torqueAfter} />
        </dl>
      </div>
    </article>
  );
}

export function Results() {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const onScroll = () => {
      const first = element.children[0] as HTMLElement | undefined;
      if (!first) return;
      const step = first.offsetWidth + 16;
      setIndex(Math.min(results.length - 1, Math.round(element.scrollLeft / step)));
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => element.removeEventListener('scroll', onScroll);
  }, []);

  const move = (direction: 1 | -1) => {
    const element = track.current;
    const first = element?.children[0] as HTMLElement | undefined;
    if (!element || !first) return;
    element.scrollBy({ left: direction * (first.offsetWidth + 16), behavior: 'smooth' });
  };

  return (
    <section id="resultados" aria-labelledby="resultados-titulo" className="py-[120px] lg:py-[200px]">
      <div className="gutter grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <Heading
          id="resultados-titulo"
          lines={['Do original', 'ao acertado.']}
          className="text-[clamp(32px,9.6vw,64px)] lg:col-span-8 lg:text-[clamp(60px,7vw,130px)]"
        />
        <div data-reveal className="lg:col-span-4 lg:pb-3">
          <p className="max-w-[26em] text-[17px] text-ink lg:text-[19px]">
            Quatro projetos no formato do relatório que você recebe: modelo, motor, stage e os
            números de antes e depois.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={index === 0}
              aria-label="Resultado anterior"
              className="flex h-12 w-12 items-center justify-center bg-ink/10 text-ink transition-colors duration-300 hover:bg-ink hover:text-void disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={index === results.length - 1}
              aria-label="Próximo resultado"
              className="flex h-12 w-12 items-center justify-center bg-ink/10 text-ink transition-colors duration-300 hover:bg-ink hover:text-void disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <div className="ml-3 h-[3px] flex-1 bg-ink/15" aria-hidden="true">
              <div
                className="h-full origin-left bg-accent transition-transform duration-500 ease-out"
                style={{ transform: `scaleX(${(index + 1) / results.length})` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={track}
        data-reveal
        data-lenis-prevent-touch
        tabIndex={0}
        role="group"
        aria-label="Galeria de resultados — role na horizontal"
        className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-[var(--gutter)] pb-2 [scroll-padding-inline:var(--gutter)] [scrollbar-width:none] lg:mt-20 [&::-webkit-scrollbar]:hidden"
      >
        {results.map((item, i) => (
          <Spread key={item.model} item={item} index={i} />
        ))}
      </div>
      <p className="gutter mt-5 text-[14px] text-ink/60">
        Valores ilustrativos, usados para demonstrar o formato. Ganhos reais dependem do veículo, do
        combustível e do estado de manutenção.
      </p>
    </section>
  );
}
