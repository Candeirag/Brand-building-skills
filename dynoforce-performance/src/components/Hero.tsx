import gsap from 'gsap';
import { ArrowDown, ArrowRight, Play, Square } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelHeroRun,
  createHeroScroll,
  playHeroIntro,
  playHeroRun,
  scrollToChapter,
} from '../animations/heroTimeline';
import { scrollToTarget } from '../animations/scrollAnimations';
import { brand, heroRun, services } from '../config/siteConfig';
import { useIsCompact } from '../hooks/useMediaQuery';
import { useQuality } from '../hooks/useQuality';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useWebGLSupport } from '../hooks/useWebGLSupport';
import { CHAPTERS, formatInt } from '../lib/dynoPhysics';
import { dyno, useAutoplay, useChapter, useEntered } from '../state/dynoStore';
import { loadStore } from '../state/loadStore';
import { LiveDynoChart } from './DynoChart';
import { HeroFallback } from './HeroFallback';
import { TelemetryHUD } from './TelemetryHUD';

// A cena 3D (three.js e companhia) vai num pacote separado, carregado sob demanda.
const DynoScene = lazy(() => {
  loadStore.setProgress(0.06);
  return import('../three/DynoScene').then((module) => {
    loadStore.setProgress(0.2);
    return module;
  });
});

const chapterClass = (active: boolean) =>
  `absolute transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
    active ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-6'
  }`;

export function Hero() {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const bigPower = useRef<HTMLSpanElement>(null);
  const railFill = useRef<HTMLDivElement>(null);

  const chapter = useChapter();
  const entered = useEntered();
  const autoplay = useAutoplay();
  const reduced = useReducedMotion();
  const compact = useIsCompact();
  const quality = useQuality();
  const webgl = useWebGLSupport();
  const [sceneFailed, setSceneFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const show3D = webgl && !sceneFailed;

  useEffect(() => {
    if (!webgl) loadStore.setStatus('skipped');
  }, [webgl]);

  const handleReady = useCallback(() => loadStore.setStatus('ready'), []);
  const handleError = useCallback(() => {
    setSceneFailed(true);
    loadStore.setStatus('failed');
  }, []);

  // Rolagem → progresso da puxada.
  useEffect(() => {
    if (!hero.current) return;
    return createHeroScroll(hero.current, reduced);
  }, [reduced]);

  // Fora da tela, a cena e o HUD param de trabalhar.
  useEffect(() => {
    if (!hero.current) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '80px',
    });
    observer.observe(hero.current);
    return () => observer.disconnect();
  }, []);

  // Paralaxe da câmera com o ponteiro.
  useEffect(() => {
    if (compact || reduced) return;
    const onMove = (event: PointerEvent) => {
      dyno.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      dyno.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [compact, reduced]);

  // Entrada do texto, quando a tela de carregamento sai.
  useEffect(() => {
    if (!entered || reduced || !intro.current) return;
    const timeline = playHeroIntro(intro.current);
    return () => {
      timeline.revert();
    };
  }, [entered, reduced]);

  // Número grande de potência e trilho de capítulos, escritos por quadro.
  useEffect(() => {
    if (!inView) return;
    let lastPower = '';
    const update = () => {
      const sample = dyno.sample;
      const shown = sample.p >= 0.66 ? heroRun.peakPower : sample.power;
      const text = formatInt(shown);
      if (text !== lastPower && bigPower.current) {
        lastPower = text;
        bigPower.current.textContent = text;
      }
      if (railFill.current) railFill.current.style.transform = `scaleY(${sample.p})`;
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, [inView]);

  useEffect(() => () => cancelHeroRun(), []);

  const explore = () => {
    if (!hero.current) return;
    if (autoplay) {
      cancelHeroRun();
      return;
    }
    if (reduced) scrollToChapter(hero.current, 1);
    else playHeroRun(hero.current);
  };

  const goToChapter = (index: number) => {
    cancelHeroRun();
    if (hero.current) scrollToChapter(hero.current, index);
  };

  const copyBlock =
    'left-[var(--gutter)] right-[var(--gutter)] bottom-[calc(var(--hud-h)+20px)] lg:right-auto lg:bottom-[calc(var(--hud-h)+44px)]';

  return (
    <section
      id="inicio"
      ref={hero}
      aria-label="Experiência: uma puxada no dinamômetro"
      className="relative h-[540vh] lg:h-[640vh] [--hud-h:118px] lg:[--hud-h:150px]"
    >
      <div ref={stage} className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden bg-void">
        <div className="absolute inset-0">
          {show3D ? (
            <Suspense fallback={null}>
              <DynoScene
                quality={quality}
                active={inView}
                onReady={handleReady}
                onError={handleError}
              />
            </Suspense>
          ) : (
            <HeroFallback />
          )}
        </div>

        {/* Véu neutro: garante leitura do texto sobre a cena. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,5,0.94)_0%,rgba(5,5,5,0.55)_30%,rgba(5,5,5,0)_58%),linear-gradient(to_bottom,rgba(5,5,5,0.9)_0%,rgba(5,5,5,0.6)_16%,rgba(5,5,5,0)_32%)] lg:bg-[linear-gradient(to_right,rgba(5,5,5,0.78)_0%,rgba(5,5,5,0.3)_34%,rgba(5,5,5,0)_56%),linear-gradient(to_top,rgba(5,5,5,0.9)_0%,rgba(5,5,5,0)_30%)]"
        />

        {/* 01 — IGNITION */}
        <div
          ref={intro}
          className={`${chapterClass(chapter === 0)} ${copyBlock} lg:w-[min(46vw,760px)]`}
          inert={chapter !== 0}
        >
          <h1 className="display text-[clamp(34px,9.8vw,62px)] lg:text-[clamp(50px,5.3vw,98px)]">
            {brand.heroLines.map((line) => (
              <span key={line} className="-mt-[0.16em] block overflow-hidden pb-[0.06em] pt-[0.16em]">
                <span data-hero-line className="block">
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p
            data-hero-fade
            className="mt-4 max-w-[34em] text-[15px] leading-[1.5] text-ink lg:mt-7 lg:text-[18px]"
          >
            {brand.heroSub}
          </p>
          <div data-hero-fade className="mt-5 flex gap-3 lg:mt-8">
            <button
              type="button"
              className="btn btn-primary pointer-events-auto flex-1 sm:flex-none"
              onClick={() => scrollToTarget('#contato')}
            >
              Agendar sessão
              <ArrowRight size={16} className="btn-arrow hidden sm:block" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-ghost pointer-events-auto flex-1 sm:flex-none"
              onClick={explore}
            >
              {autoplay ? (
                <Square size={13} fill="currentColor" aria-hidden="true" />
              ) : (
                <Play size={13} fill="currentColor" aria-hidden="true" />
              )}
              <span className="sm:hidden">{autoplay ? 'Parar' : 'Explorar'}</span>
              <span className="hidden sm:inline">{autoplay ? 'Parar' : 'Explorar experiência'}</span>
            </button>
          </div>
          <p
            data-hero-fade
            className="mt-6 hidden items-center gap-4 font-display text-[13px] font-medium tracking-[0.08em] text-ink/75 lg:flex"
          >
            <span className="relative block h-9 w-[2px] overflow-hidden bg-ink/20" aria-hidden="true">
              <span
                className="absolute inset-0 bg-accent"
                style={{ animation: 'scroll-hint 1.9s cubic-bezier(0.76,0,0.24,1) infinite' }}
              />
            </span>
            {brand.tagline} Role para iniciar a puxada.
          </p>
        </div>

        {/* 02 — ACCELERATION */}
        <div
          className={`${chapterClass(chapter === 1)} ${copyBlock} lg:w-[min(40vw,620px)]`}
          inert={chapter !== 1}
        >
          <h2 className="display text-[clamp(34px,9.6vw,58px)] lg:text-[clamp(48px,5.2vw,96px)]">
            Acceleration
          </h2>
          <p className="mt-4 max-w-[30em] text-[15px] leading-[1.5] text-ink lg:mt-6 lg:text-[18px]">
            O motor sai da marcha lenta, as rodas pegam os rolos e a pressão do turbo sobe. Cada
            sensor entra na leitura antes de o acelerador ir ao fundo.
          </p>
        </div>

        {/* 03 — POWER */}
        <div
          className={`${chapterClass(chapter === 2)} left-[var(--gutter)] top-[calc(var(--header-h)+12px)] lg:top-auto lg:bottom-[calc(var(--hud-h)+44px)]`}
          inert={chapter !== 2}
        >
          <h2 className="sr-only">Power: pico de potência</h2>
          <p className="num flex items-baseline font-medium leading-[0.8] tracking-[-0.07em] text-ink">
            <span ref={bigPower} className="text-[clamp(84px,24vw,150px)] lg:text-[clamp(130px,14vw,250px)]">
              0
            </span>
            <span className="ml-2 font-display text-[clamp(22px,5vw,34px)] font-bold tracking-[-0.02em] text-accent lg:ml-4 lg:text-[clamp(34px,3.4vw,60px)]">
              CV
            </span>
          </p>
          <p className="mt-3 font-display text-[13px] font-medium uppercase tracking-[0.06em] text-ink lg:mt-5 lg:text-[16px]">
            Power: pico de {heroRun.peakPower} CV a {formatInt(heroRun.peakPowerRpm)} rpm
          </p>
        </div>
        <div
          className={`${chapterClass(chapter === 2)} left-[var(--gutter)] right-[var(--gutter)] bottom-[calc(var(--hud-h)+16px)] h-[168px] lg:left-auto lg:right-[calc(var(--gutter)+64px)] lg:bottom-[calc(var(--hud-h)+44px)] lg:h-[min(34vh,320px)] lg:w-[min(34vw,520px)]`}
          aria-hidden={chapter !== 2}
        >
          <LiveDynoChart active={inView && chapter >= 1 && chapter <= 2} />
        </div>

        {/* 04 — PRECISION */}
        <div
          className={`${chapterClass(chapter === 3)} ${copyBlock} lg:w-[min(42vw,660px)]`}
          inert={chapter !== 3}
        >
          <h2 className="display text-[clamp(34px,9.6vw,58px)] lg:text-[clamp(48px,5.2vw,96px)]">
            Precision
          </h2>
          <p className="mt-4 max-w-[31em] text-[15px] leading-[1.5] text-ink lg:mt-6 lg:text-[18px]">
            O carro alivia, os números ficam. A curva que você acabou de ver é o que orienta cada
            serviço: {services
              .slice(0, 3)
              .map((service) => service.title)
              .join(', ')}{' '}
            e mais três.
          </p>
          <div className="mt-5 flex gap-3 lg:mt-8">
            <button
              type="button"
              className="btn btn-primary pointer-events-auto flex-1 sm:flex-none"
              onClick={() => scrollToTarget('#contato')}
            >
              Agendar sessão
              <ArrowRight size={16} className="btn-arrow hidden sm:block" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-ghost pointer-events-auto flex-1 sm:flex-none"
              onClick={() => scrollToTarget('#remap')}
            >
              Ver serviços
              <ArrowDown size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Trilho de capítulos */}
        <nav
          aria-label="Capítulos da experiência"
          className="absolute right-[var(--gutter)] top-1/2 z-20 hidden -translate-y-1/2 lg:block"
        >
          <div className="absolute right-0 top-0 h-full w-[2px] bg-ink/15" aria-hidden="true">
            <div ref={railFill} className="h-full w-full origin-top bg-accent" style={{ transform: 'scaleY(0)' }} />
          </div>
          <ol className="flex flex-col gap-7 pr-5">
            {CHAPTERS.map((item, index) => (
              <li key={item.id} className="flex justify-end">
                <button
                  type="button"
                  onClick={() => goToChapter(index)}
                  aria-current={chapter === index ? 'step' : undefined}
                  className={`tag flex items-center gap-3 py-1 transition-colors duration-500 ${
                    chapter === index ? 'text-ink' : 'text-ink/45 hover:text-ink'
                  }`}
                >
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-500 ${
                      chapter === index ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="num">{item.number}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <TelemetryHUD active={inView} />
      </div>
    </section>
  );
}
