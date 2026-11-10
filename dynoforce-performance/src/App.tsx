import { useCallback, useEffect } from 'react';
import { initReveals, initSmoothScroll, lockScroll, ScrollTrigger } from './animations/scrollAnimations';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { DynoSection } from './components/DynoSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LoadingScreen } from './components/LoadingScreen';
import { Results } from './components/Results';
import { RpmCursor } from './components/RpmCursor';
import { Services } from './components/Services';
import { WhatsAppButton } from './components/WhatsAppButton';
import { useReducedMotion } from './hooks/useReducedMotion';
import { setFlag, useEntered } from './state/dynoStore';

export default function App() {
  const reduced = useReducedMotion();
  const entered = useEntered();

  useEffect(() => {
    const stopScroll = initSmoothScroll(reduced);
    const stopReveals = initReveals(reduced);
    const refresh = () => ScrollTrigger.refresh();
    void document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      window.removeEventListener('load', refresh);
      stopReveals();
      stopScroll();
    };
  }, [reduced]);

  // A página fica parada no topo enquanto a tela de carregamento está na frente.
  useEffect(() => {
    if (entered) return;
    window.scrollTo(0, 0);
    lockScroll(true);
    return () => lockScroll(false);
  }, [entered]);

  const handleLoaded = useCallback(() => setFlag('entered', true), []);

  return (
    <>
      <a
        href="#remap"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-ink focus:px-4 focus:py-3 focus:text-void"
      >
        Pular a experiência e ir para os serviços
      </a>
      <LoadingScreen onDone={handleLoaded} />
      <Header />
      <main>
        <Hero />
        <Services />
        <DynoSection />
        <Results />
        <About />
        <FinalCTA />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      <RpmCursor />
    </>
  );
}
