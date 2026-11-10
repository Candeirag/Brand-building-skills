import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHAPTERS } from '../lib/dynoPhysics';
import { dyno, setFlag, setProgress } from '../state/dynoStore';
import { getLenis } from './scrollAnimations';

gsap.registerPlugin(ScrollTrigger);

/**
 * Liga o progresso da puxada à rolagem do hero. O hero é um trecho alto com um
 * palco `position: sticky` dentro — nada é "pinado" por script, então a
 * rolagem nunca trava.
 */
export function createHeroScroll(hero: HTMLElement, reducedMotion: boolean): () => void {
  const proxy = { value: 0 };
  const tween = gsap.to(proxy, {
    value: 1,
    ease: 'none',
    onUpdate: () => setProgress(proxy.value),
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reducedMotion ? true : 0.6,
    },
  });
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

/** Posição de rolagem (px) em que um ponto do progresso da puxada acontece. */
export function heroScrollPosition(hero: HTMLElement, progress: number): number {
  const top = hero.getBoundingClientRect().top + window.scrollY;
  return top + (hero.offsetHeight - window.innerHeight) * progress;
}

export function scrollToChapter(hero: HTMLElement, index: number) {
  const start = CHAPTERS[index].start;
  const end = index + 1 < CHAPTERS.length ? CHAPTERS[index + 1].start : 1;
  // Um pouco para dentro do capítulo, onde a cena dele já está montada.
  const target = heroScrollPosition(hero, start + (end - start) * (index === 0 ? 0 : 0.55));
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else window.scrollTo({ top: target });
}

let stopAutoplay: (() => void) | null = null;

/**
 * Reprodução automática limitada: rola o hero inteiro sozinho, uma vez, em
 * ~18 s. Qualquer gesto do visitante (roda, toque, teclado) devolve o controle.
 */
export function playHeroRun(hero: HTMLElement) {
  stopAutoplay?.();
  const from = Math.max(window.scrollY, heroScrollPosition(hero, 0));
  const to = heroScrollPosition(hero, 0.97);
  if (to - from < 40) return;

  const duration = 18 * ((to - from) / (to - heroScrollPosition(hero, 0)));
  const lenis = getLenis();
  const position = { y: from };
  setFlag('autoplay', true);

  const tween = gsap.to(position, {
    y: to,
    duration,
    ease: 'none',
    onUpdate: () => {
      if (lenis) lenis.scrollTo(position.y, { immediate: true, force: true });
      else window.scrollTo(0, position.y);
    },
    onComplete: () => stop(),
  });

  const events: (keyof WindowEventMap)[] = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  const interrupt = () => stop();
  function stop() {
    tween.kill();
    events.forEach((name) => window.removeEventListener(name, interrupt));
    setFlag('autoplay', false);
    stopAutoplay = null;
  }
  // O clique que iniciou a reprodução não pode ser o que a interrompe.
  window.setTimeout(() => {
    if (!dyno.autoplay) return;
    events.forEach((name) => window.addEventListener(name, interrupt, { passive: true }));
  }, 250);
  stopAutoplay = stop;
}

export function cancelHeroRun() {
  stopAutoplay?.();
}

/** Entrada do texto do hero, depois que a tela de carregamento sai. */
export function playHeroIntro(scope: HTMLElement): gsap.core.Timeline {
  const timeline = gsap.timeline({ defaults: { ease: 'expo.out' } });
  timeline
    .fromTo(
      scope.querySelectorAll('[data-hero-line]'),
      { yPercent: 110 },
      { yPercent: 0, duration: 1.3, stagger: 0.11, delay: 0.25 },
    )
    .fromTo(
      scope.querySelectorAll('[data-hero-fade]'),
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.09 },
      '-=0.85',
    );
  return timeline;
}
