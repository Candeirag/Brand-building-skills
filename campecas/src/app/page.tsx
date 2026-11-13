import { Cursor } from "@/components/cinema/Cursor";
import { FilmGrain } from "@/components/cinema/FilmGrain";
import { Preloader } from "@/components/cinema/Preloader";
import { SmoothScroll } from "@/components/cinema/SmoothScroll";
import { Timecode } from "@/components/cinema/Timecode";
import { Hero } from "@/components/sections/Hero";
import { Header } from "@/components/ui/Header";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import { autoRepairSchema, jsonLd } from "@/lib/schema";

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
      </main>

      <Timecode />
      <WhatsAppFab />
      <FilmGrain />
      <Cursor />
    </SmoothScroll>
  );
}
