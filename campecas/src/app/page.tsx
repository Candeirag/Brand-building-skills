import { Cursor } from "@/components/cinema/Cursor";
import { FilmGrain } from "@/components/cinema/FilmGrain";
import { Preloader } from "@/components/cinema/Preloader";
import { SmoothScroll } from "@/components/cinema/SmoothScroll";
import { Timecode } from "@/components/cinema/Timecode";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Chapters } from "@/components/sections/Chapters";
import { Credits } from "@/components/sections/Credits";
import { Family } from "@/components/sections/Family";
import { Finale } from "@/components/sections/Finale";
import { Gallery } from "@/components/sections/Gallery";
import { Hero } from "@/components/sections/Hero";
import { Numbers } from "@/components/sections/Numbers";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { Header } from "@/components/ui/Header";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import { autoRepairSchema, jsonLd } from "@/lib/schema";

/**
 * Página única. A ordem das seções é a ordem das cenas do "trailer".
 * O <Timecode> fica depois das seções de propósito: os ScrollTriggers dele
 * precisam nascer depois dos pins das cenas.
 */
export default function Home() {
  return (
    <SmoothScroll>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(autoRepairSchema()) }} />
      <noscript>
        <style>{".preloader{display:none!important}"}</style>
      </noscript>
      <a
        href="#conteudo"
        className="label fixed top-2 left-2 z-110 -translate-y-20 bg-bone px-4 py-3 text-ink focus-visible:translate-y-0"
      >
        Pular para o conteúdo
      </a>

      <Preloader />
      <Header />

      <main id="conteudo">
        <Hero />
        <BeforeAfter />
        <Chapters />
        <Process />
        <Numbers />
        <Gallery />
        <Family />
        <Testimonials />
        <Finale />
      </main>
      <Credits />

      <Timecode />
      <WhatsAppFab />
      <FilmGrain />
      <Cursor />
    </SmoothScroll>
  );
}
