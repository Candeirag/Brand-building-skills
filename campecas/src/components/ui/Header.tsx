import { nav } from "@/content/site";
import { LetterboxBar } from "@/components/cinema/Letterbox";
import { Logo } from "./Logo";

/** Barra superior do letterbox: logo + navegação por âncoras. */
export function Header() {
  return (
    <LetterboxBar position="top" as="header">
      <a href="#topo" aria-label="Campeças, voltar ao início" className="flex items-center py-2">
        <Logo className="h-4.5 w-auto text-bone md:h-5" title="" />
      </a>
      <nav aria-label="Seções do site" className="hidden lg:block">
        <ul className="flex items-center gap-8">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="label py-3 text-bone opacity-65 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a href="#contato" className="label py-3 text-bone lg:hidden">
        Contato
      </a>
    </LetterboxBar>
  );
}
