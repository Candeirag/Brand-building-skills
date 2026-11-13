# Campeças – Peças e Serviços

Site de uma página da Campeças, oficina de família no DF (lanternagem, pintura e mecânica). A proposta é cinematográfica: rolar a página deve parecer assistir a um trailer.

Feito com Next.js 16 (App Router), TypeScript, Tailwind CSS 4, GSAP (ScrollTrigger e SplitText) e Lenis.

## Rodar no computador

Precisa do [Node.js](https://nodejs.org) 20.9 ou mais novo.

```bash
npm install
```

```bash
npm run dev
```

Abra `http://localhost:3000`. O site recarrega sozinho a cada alteração.

Para conferir a versão final, igual à que vai para o ar:

```bash
npm run build
```

```bash
npm run start
```

## Onde mexer

| O que | Onde |
| --- | --- |
| Textos, telefones, endereço, horário, Instagram, números, depoimentos | `src/content/site.ts` |
| Fotos e vídeo | `public/media/` (guia de filmagem em `public/media/MEDIA.md`) |
| Cores, fontes e medidas | `src/app/globals.css` (bloco `@theme`) |
| Título e descrição para o Google | `src/app/layout.tsx` |

### Antes de publicar: placeholders a preencher

Tudo que aparece entre colchetes no site ainda é provisório. Em `src/content/site.ts`:

- [ ] `site.address`: hoje `[ENDEREÇO], DF`. Com o endereço real, o mapa do Google e o link "Abrir no Google Maps" aparecem sozinhos.
- [ ] `site.hours`: hoje `[HORÁRIO]`.
- [ ] `site.instagram`: hoje `[@PERFIL]`.
- [ ] `numbers.items`: os valores marcados com `placeholder: true` são **de exemplo**. Troque pelo número real e mude para `placeholder: false` (a etiqueta "valor de exemplo" some).
- [ ] `testimonials.items`: só a estrutura. Cole depoimentos reais, com autorização de quem escreveu.
- [ ] `family.story`: a história da família.
- [ ] `gallery.items`: legendas de cada trabalho.
- [ ] Textos dos serviços (`chapters`) e do processo (`workflow`): confira se descrevem o que a oficina realmente faz.
- [ ] Fotos e vídeo reais em `public/media/` (veja o `MEDIA.md`).

O WhatsApp já está preenchido com o celular do logo, (61) 99864-9037. Se um dia o número voltar a ser `[NÚMERO]`, os botões passam a levar para a seção de contato em vez de abrir um link quebrado.

## Publicar na Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) e conecte o GitHub.
2. **Add New → Project** e escolha este repositório.
3. Em **Root Directory**, selecione `campecas` (o site fica nessa pasta, não na raiz do repositório). O resto a Vercel detecta sozinha (Next.js, `npm run build`).
4. Clique em **Deploy**. Em um ou dois minutos o site está no ar em um endereço `*.vercel.app`.
5. Para usar um domínio próprio: **Settings → Domains** no projeto. Depois, em **Settings → Environment Variables**, crie `NEXT_PUBLIC_SITE_URL` com o endereço final (por exemplo `https://www.seudominio.com.br`) e faça um novo deploy. É esse valor que vai para o Google (canonical, sitemap, Open Graph e dados estruturados). Sem a variável, o site usa o endereço de produção da Vercel.

A partir daí, cada `git push` no branch de produção publica uma versão nova, e cada outro branch ganha um endereço de prévia.

Depois de publicar, vale cadastrar o site no [Google Search Console](https://search.google.com/search-console), enviar `/sitemap.xml` e colocar o endereço do site no Perfil da Empresa no Google.

## Como o site é montado

```
src/app/                  layout (fontes, metadata), página, CSS global, robots e sitemap
src/content/site.ts       todo o conteúdo editável
src/components/cinema/    rolagem suave, preloader, barras de letterbox, grão, timecode, cursor
src/components/sections/  as cenas, na ordem em que aparecem
src/components/ui/        logo, cabeçalho, botões de WhatsApp, lightbox
src/lib/                  GSAP (registro único dos plugins), WhatsApp, JSON-LD, hooks
```

Decisões de projeto que valem para qualquer alteração futura:

- **Uma cor de destaque só**: o vermelho do logo, `#BF1A2C`. A paleta padrão do Tailwind foi zerada de propósito; só existem as cores do `@theme`.
- **Duas fontes**: Anton (títulos) e Inter Tight (texto), via `next/font`.
- **Animações só com `transform` e `opacity`**, sempre dentro de `useGSAP` (que limpa tudo ao desmontar). Os plugins são registrados uma vez, em `src/lib/gsap.ts`.
- **Movimento reduzido**: com `prefers-reduced-motion`, não há preloader, rolagem suave, cenas fixadas nem vídeo em autoplay; o conteúdo aparece direto e o antes → depois vira botões.
- **Cenas fixadas só onde cabem**: os capítulos de serviço e a linha do tempo horizontal ficam fixados em telas a partir de 1024 px de largura e 680 px de altura (variante `stage:` no CSS, `MQ.stage` no JS). Em telas menores as cenas ficam empilhadas.
- **Placeholders honestos**: nada de foto de banco de imagens, depoimento inventado ou número inventado.
- Este projeto usa o Next.js 16: antes de mexer em APIs do framework, leia `AGENTS.md`.
