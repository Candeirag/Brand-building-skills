# Campeças — plano e passagem de bastão

Site da **Campeças – Peças e Serviços**, oficina de família no DF: lanternagem, pintura e mecânica. Este arquivo existe para que outra sessão continue o trabalho sem o histórico da anterior. Apague-o quando o site estiver pronto.

## O pedido (resumo fiel do briefing do cliente)

O site precisa ser **cinematográfico**: rolar a página deve parecer assistir a um trailer, não um site de oficina comum.

**Objetivo**
- Passar confiança, capricho e qualidade de acabamento ("seu carro sai daqui melhor do que entrou").
- Converter visitas em contato pelo WhatsApp (CTA principal) e em visitas à oficina.
- Identidade forte e própria. Nada de visual genérico de IA: sem gradiente roxo, sem glassmorphism, sem ícones genéricos, sem "hero com título centralizado + dois botões".

**Stack**
- Next.js (App Router) + TypeScript + Tailwind CSS
- GSAP + ScrollTrigger + SplitText; Lenis para smooth scroll
- Deploy pensado para a Vercel
- Componentes organizados, sem biblioteca de UI pronta

**Direção de arte: "garagem à noite, luz de cabine de pintura"**
- Preto profundo/grafite, um único acento, branco quebrado para texto.
- Display condensado e pesado nos títulos, caixa alta, gigantes; sans limpa no corpo.
- Grão de filme sutil (overlay animado), vinheta, flares de luz passando, sensação de metal e verniz molhado.
- Linguagem de cinema: barras de letterbox 21:9 que abrem no início, cortes secos entre seções, legendas "CENA 01 / LANTERNAGEM", números de cena, timecode discreto num canto.

**Cenas**
1. **Intro/preloader (2–3 s):** tela preta, linha de luz que se acende ("motor ligando"), contador 00→100, as barras de letterbox se abrem revelando o hero.
2. **Hero:** vídeo de fundo em loop, escurecido. Título enorme revelado letra a letra com SplitText: "DO AMASSADO AO ESPELHADO." Subtítulo curto + botão "Orçamento no WhatsApp". Indicador de scroll.
3. **Antes → Depois (seção principal):** pinned com scroll-scrub. O carro amassado vira o carro restaurado conforme a rolagem. Legendas: "Desamassar → Preparar → Pintar → Polir".
4. **Serviços como capítulos:** Lanternagem, Pintura, Mecânica e Peças. Tela inteira cada, imagem grande, parallax, número do capítulo gigante ao fundo, texto curto e direto. Cortes de cena entre eles.
5. **O processo:** linha do tempo horizontal pinned: recebimento → diagnóstico → orçamento → execução → entrega, cada etapa com microanimação.
6. **Números:** contadores animados; valores como placeholders fáceis de editar.
7. **Galeria:** grid assimétrico, hover com zoom lento que revela o "antes", lightbox cinematográfico.
8. **Quem faz:** oficina de família, tom humano e orgulhoso, foto P&B que ganha cor no scroll.
9. **Depoimentos:** só a estrutura. NÃO inventar depoimentos nem nomes; marcar como "[DEPOIMENTO REAL AQUI]".
10. **CTA final + contato:** frase grande tipo créditos finais, botão WhatsApp, endereço, horário, mapa do Google embutido, redes sociais. Rodapé estilo "créditos rolando".
- Botão flutuante de WhatsApp sempre visível, discreto, com animação sutil.

**Regras de animação**
- Animar só `transform` e `opacity`. `will-change` com moderação.
- `useGSAP` com cleanup correto; registrar plugins só no client.
- Easings cinematográficos (`power4.out`, `expo.inOut`), revelações longas, nada "pulando".
- Cursor customizado sutil no desktop (círculo que cresce sobre links e imagens).
- Respeitar `prefers-reduced-motion`: desligar scrub e parallax pesados e mostrar o conteúdo direto.
- Mobile: manter a sensação cinematográfica, simplificar os pins pesados, mídia leve.

**Conteúdo e assets**
- Todo o texto em português do Brasil, curto, confiante, sem clichê corporativo.
- `/public/media` com placeholders bem nomeados e um `MEDIA.md` listando cada mídia a fotografar ou filmar, com enquadramento e duração sugeridos.
- Todos os dados editáveis em `src/content/site.ts`, com estes placeholders:
  - WhatsApp: `[NÚMERO]`
  - Endereço: `[ENDEREÇO], DF`
  - Horário: `[HORÁRIO]`
  - Instagram: `[@PERFIL]`

**Qualidade técnica**
- Lighthouse alto: `next/image`, vídeo com `poster` e `preload="metadata"`, `next/font`.
- SEO local: metadata, Open Graph, schema.org `AutoRepair` com os dados do `site.ts`.
- Acessibilidade: contraste AA, foco visível, alt text, teclado.
- Responsivo, mobile-first (a maioria dos clientes acessa pelo celular).

**Como trabalhar**
1. Mostrar um plano curto antes de codar (já feito; decisões abaixo).
2. Construir por etapas: base + design tokens → intro + hero → antes/depois → demais seções → polimento → responsivo/performance.
3. No fim, rodar o build, corrigir erros e explicar como rodar localmente e como subir na Vercel.

## Decisões já tomadas

- **Cor de destaque: vermelho do logo, `#BF1A2C`** (medido no PDF vetorial). O briefing sugeria âmbar "por exemplo", mas o logo da Campeças é vermelho sobre grafite, e o briefing pede no máximo uma cor de destaque. O calor de faísca fica só nas imagens e no vídeo. O cliente viu essa decisão no plano e não contestou.
- **Fundo** `#0B0B0C` e `#151517`. **Texto** `#EDE9E3`.
- **Fontes:** Anton (títulos) e Inter Tight (corpo, legendas, timecode com algarismos tabulares). Duas fontes, via `next/font/google`.
- **Capítulos de serviço em cortes secos**, não em rolagem horizontal: o processo já é horizontal, e dois trechos horizontais seguidos ficariam repetitivos. Ideia: um palco fixado em que o índice do capítulo troca de uma vez (sem transição), com um quadro de flash e a entrada do texto a cada corte.
- **Comparador antes/depois só com `transform`:** uma máscara com `overflow: hidden` desliza enquanto a imagem interna desliza no sentido contrário, mais uma barra de luz na borda. Dispensa `clip-path`.
- **P&B que ganha cor:** duas cópias da foto, a de cima com `filter: grayscale(1)` estático e a opacidade dela guiada pelo scroll.
- **Placeholders honestos:** claquetes de storyboard com o nome do arquivo e a instrução de filmagem. Nenhuma foto de banco de imagens fingindo ser trabalho da oficina.
- **Números:** valores de exemplo em `site.ts`, com uma marca visível de "valor de exemplo" enquanto `placeholder: true`.
- **WhatsApp:** seguir o briefing e deixar `[NÚMERO]`. Enquanto for placeholder, os botões levam para `#contato` em vez de um link quebrado.

## O que o logo revela

`public/logo.svg` (pistão + "CAMPEÇAS") e `public/mark.svg` (só o pistão) foram extraídos do PDF vetorial. As letras usam `currentColor`; o pistão é `#BF1A2C`.

O logo traz dois telefones: **(61) 3575-5864** e **(61) 99864-9037**. O cliente pediu placeholder para o WhatsApp, então não assumi que o celular é o WhatsApp. Vale perguntar e, se confirmado, preencher em `site.ts`. O logo também existe com dois subtítulos: "Lanternagem e Pintura" e "Peças e Serviços"; o nome do site é "Campeças – Peças e Serviços".

## Estado atual

Feito:
- Projeto criado com `create-next-app` (Next 16.4.6, React 19, Tailwind 4, TypeScript, App Router, `src/`), mais `gsap`, `@gsap/react` e `lenis` instalados.
- `public/logo.svg`, `public/mark.svg`, `public/grain.png` (ladrilho de grão de filme).
- `public/media/` com todos os placeholders: `hero.mp4` (6 s, loop perfeito, faíscas geradas por código, 800 kB), `hero-poster.jpg`, `transformacao-01-amassado.jpg` a `-04-polido.jpg` (a mesma porta em quatro estágios, mesmo enquadramento), `lanternagem.jpg`, `pintura.jpg`, `mecanica.jpg`, `pecas.jpg`, `trabalho-01..06-antes.jpg` e `-depois.jpg`, `familia.jpg`, `og.jpg`.
- `scripts/make-placeholders.py` regenera tudo: `python3 scripts/make-placeholders.py scripts/fonts [pasta-de-quadros]`. O comando do ffmpeg para o vídeo está no cabeçalho do script.

Falta (nada de código do site foi escrito ainda; `src/app` é o padrão do `create-next-app`):
1. Design tokens em `globals.css`, fontes e metadata em `layout.tsx`, `src/content/site.ts`.
2. Camada de cinema: `SmoothScroll` (Lenis + ScrollTrigger), `Preloader`, `Letterbox`, `FilmGrain`, `Timecode` + legenda de cena, `Cursor`.
3. Seções na ordem do briefing.
4. `public/media/MEDIA.md` (lista do que fotografar e filmar: enquadramento e duração por arquivo).
5. SEO: metadata, Open Graph (`/media/og.jpg`), JSON-LD `AutoRepair`, `robots.ts`, `sitemap.ts`.
6. Reduced motion, mobile, acessibilidade, build, instruções de execução e de deploy na Vercel.

Arquitetura planejada:
```
src/app/                  layout.tsx, page.tsx, globals.css, robots.ts, sitemap.ts
src/content/site.ts       todos os dados editáveis
src/components/cinema/    Preloader, Letterbox, FilmGrain, Timecode, Cursor, SmoothScroll
src/components/sections/  Hero, BeforeAfter, Chapters, Process, Numbers, Gallery, Family, Testimonials, Finale, Credits
src/components/ui/        Logo, WhatsAppButton, WhatsAppFab, Lightbox, Header
src/lib/                  gsap.ts, whatsapp.ts, schema.ts
```

## Avisos sobre este Next.js (16.4)

O `AGENTS.md` do projeto manda ler `node_modules/next/dist/docs/` antes de escrever código. O que já conferi:
- `next/image`: `priority` foi descontinuado; use `preload`. Qualidades fora de `[75]` precisam estar em `images.qualities` no `next.config.ts`.
- `next.config.ts` vem com `cacheComponents: true`: `new Date()`, `Date.now()` e `Math.random()` durante o prerender quebram o build. Use-os só em componentes client (dentro de efeitos) ou em valores fixos.
- JSON-LD: `<script type="application/ld+json">` com `JSON.stringify(...).replace(/</g, '\\u003c')`.
- `metadata`, `robots.ts` e `sitemap.ts` seguem as convenções habituais.
- O Tailwind é a versão 4, carregado pelo `@tailwindcss/turbopack` configurado no `next.config.ts`.
- SplitText faz parte do pacote `gsap` gratuito (`gsap/SplitText`).

## Conferência

O ambiente desta sessão não tem placa de vídeo. Para olhar o resultado, o Playwright com Chromium já está instalado (`require('playwright')`); capturas em 390, 768 e 1440 px bastam para conferir layout e sobreposição de texto.
