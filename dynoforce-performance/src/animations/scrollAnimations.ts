import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export const getLenis = () => lenis;

/**
 * Rolagem suave (Lenis) sincronizada com o ScrollTrigger.
 * Com `prefers-reduced-motion` nada disso é ligado: a rolagem é a nativa.
 */
export function initSmoothScroll(reducedMotion: boolean): () => void {
  if (reducedMotion) return () => {};

  const instance = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
  lenis = instance;
  instance.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    instance.destroy();
    if (lenis === instance) lenis = null;
  };
}

/** Trava ou libera a rolagem (tela de carregamento, menu aberto). */
export function lockScroll(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

export function scrollToTarget(target: string | number | HTMLElement, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 });
    return;
  }
  const top =
    typeof target === 'number'
      ? target
      : ((typeof target === 'string' ? document.querySelector(target) : target)?.getBoundingClientRect()
          .top ?? 0) + window.scrollY;
  window.scrollTo({ top: top + offset });
}

/**
 * Entrada das seções: cada elemento com `data-reveal` sobe e aparece uma vez,
 * em cascata com os vizinhos que entram juntos. O estado escondido só existe
 * quando `html.motion-ok` está presente, então sem JS (ou com movimento
 * reduzido) o conteúdo simplesmente está lá.
 */
export function initReveals(reducedMotion: boolean): () => void {
  if (reducedMotion) return () => {};
  document.documentElement.classList.add('motion-ok');

  // gsap.context registra tudo que é criado aqui; `revert()` desfaz inclusive
  // os estilos inline, então remontar o componente não deixa nada escondido.
  const context = gsap.context(() => {
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: (elements) =>
        gsap.to(elements, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.08,
          overwrite: true,
        }),
    });

    // Linhas de título que sobem de dentro de uma máscara.
    gsap.utils.toArray<HTMLElement>('[data-line]').forEach((line) => {
      gsap.fromTo(
        line,
        { yPercent: 108 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: line.parentElement, start: 'top 94%', once: true },
        },
      );
    });

    // Imagens com deslocamento leve atrelado à rolagem.
    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
      gsap.fromTo(
        element,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: element.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    });
  });

  return () => {
    context.revert();
    document.documentElement.classList.remove('motion-ok');
  };
}

export { ScrollTrigger };
