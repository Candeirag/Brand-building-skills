# DYNOFORCE PERFORMANCE

Site de uma oficina de remap e dinamômetro. O hero é uma puxada de dinamômetro em 3D controlada pela rolagem: o carro acelera nos rolos, a fumaça sobe, a telemetria e o gráfico de potência são traçados em sincronia, e a página segue para serviços, comparação antes/depois, resultados, sobre e agendamento por WhatsApp.

React 19 · TypeScript · Vite · Three.js · React Three Fiber · drei · GSAP ScrollTrigger · Lenis · Tailwind CSS 4.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # confere os tipos e gera dist/
npm run preview    # serve o build de produção
```

Requer Node 20 ou mais novo.

## O que editar antes de publicar

Tudo que é da empresa fica em `src/config/siteConfig.ts`.

| O quê | Onde |
| --- | --- |
| Número do WhatsApp | `contact.whatsappPhone` (só dígitos, com 55 + DDD). Depois de trocar, ponha `whatsappIsPlaceholder: false` para sumir o aviso do formulário. |
| Endereço, cidade, horário, Instagram | `contact` |
| Textos do hero, slogan, sobre | `heroLines`, `heroSub`, `about` |
| Serviços | `services` |
| Resultados e comparação antes/depois | `results`, `dynoComparison` |
| Números da puxada do hero | `heroRun` |
| Cor de destaque (CTA, redline, LEDs da cena) | `colors.accent` |

Os números de potência, torque e boost que vêm no projeto são **ilustrativos**. O site já os identifica como demonstração no HUD, nos gráficos, nos resultados e no rodapé. Ao trocar por medições reais, remova esses avisos nos componentes correspondentes.

### Duas marcas no mesmo código

`siteConfig.ts` traz dois presets:

- `dynoforce` — a marca fictícia DYNOFORCE PERFORMANCE, em vermelho. É o padrão.
- `gpgarage` — GP Garage Performance, em turquesa, com o logo (`public/images/gp-garage-logo.png`), os textos institucionais, a equipe e o Instagram reais.

Para trocar: mude `DEFAULT_BRAND`, ou faça o build com `VITE_BRAND=gpgarage npm run build`, ou abra com `?brand=gpgarage` para pré-visualizar. A cor de destaque muda no CSS e também nas luzes da cena 3D.

## Trocar o carro 3D

O modelo atual é `public/models/ferrari-458.glb` (1,7 MB, compressão Draco, rodas em nodes separados). Para usar outro:

1. Coloque o `.glb` em `public/models/` e aponte `url` em `src/config/carConfig.ts`.
2. Abra o site com `?debug=nodes`. O console lista todos os nodes e materiais do arquivo.
3. Em `wheels`, informe o node de cada roda, se ela é motriz (`driven`), o eixo local de giro (`axis`) e o sentido (`direction`). O pivô do node precisa estar no centro da roda. Em `staticChildren` vão as peças que não giram (pinças).
4. Em `materials`, associe os nomes dos meshes aos materiais da cena (`paint`, `rim`, `glass`, `tire`…).
5. Ajuste `transform`, `wheelRadius`, `drivenTrack`, `exhaust` e `dynoConfig.axleZ` até as rodas motrizes ficarem sobre os rolos. A frente do carro aponta para -Z e os pneus tocam y = 0.

Se o modelo novo vier com as quatro rodas num único mesh, separe-as antes no Blender (*Separate by loose parts* e *Origin to geometry*). O código gira cada roda no próprio eixo e não gira o carro inteiro para simular movimento.

A velocidade de giro desenhada satura em cerca de 5 voltas por segundo, com um disco de borrão por cima: a 212 km/h a roda real gira a 25 voltas por segundo, o que a 60 quadros por segundo aparece como cintilação. A telemetria mostra a velocidade real.

## Som do motor

O botão SOUND/MUTE do HUD liga um motor sintetizado com Web Audio, cujo tom acompanha o RPM. Nada toca antes de um clique. Para usar uma gravação própria ou licenciada, coloque um loop em `public/audio/` e preencha `audioConfig.src` e `audioConfig.sampleRpm` em `siteConfig.ts`.

## Como a experiência funciona

- **Uma fonte de verdade.** A rolagem do hero vira um progresso de 0 a 1 (`animations/heroTimeline.ts`). `lib/dynoPhysics.ts` transforma esse progresso em RPM, velocidade, potência, torque, boost, temperatura, luz e fumaça. Cena 3D, HUD, gráfico e áudio leem o mesmo `dyno.sample` a cada quadro, sem passar pelo estado do React.
- **Sem travar a rolagem.** O hero é um trecho alto com um palco `position: sticky`. Nada é pinado por script.
- **Reprodução automática.** "Explorar experiência" rola o hero sozinho uma vez, em cerca de 18 s. Qualquer gesto devolve o controle.
- **Capítulos.** IGNITION, ACCELERATION, POWER e PRECISION são faixas do progresso (`RUN` e `CHAPTERS` em `dynoPhysics.ts`). A câmera interpola entre quadros-chave em `three/CameraController.tsx`, com um conjunto para paisagem e outro para tela em pé.
- **Fumaça.** Partículas simuladas na CPU e desenhadas como billboards com ruído procedural no shader (`three/SmokeParticles.tsx`). A emissão segue a carga do motor e o que já foi emitido se dissipa sozinho.

## Desempenho e fallbacks

- A cena 3D fica num pacote separado, carregado sob demanda (cerca de 320 kB gzip). O restante do site soma cerca de 150 kB gzip.
- `hooks/useQuality.ts` escolhe o nível gráfico. Celulares e máquinas com poucos núcleos recebem menos partículas, sem pós-processamento, sem piso espelhado e sem sombras. `?quality=low` ou `?quality=high` forçam um nível.
- A densidade de pixels do canvas cai sozinha se a taxa de quadros cair (`PerformanceMonitor`).
- A cena para de renderizar quando o hero sai da tela.
- Sem WebGL, ou se o modelo falhar, entra `components/HeroFallback.tsx` com uma imagem da cena. O HUD e o gráfico continuam respondendo à rolagem. `?webgl=off` simula esse caso.
- A tela de carregamento espera no máximo 16 s. Depois disso o site abre e a cena termina de carregar em segundo plano.
- Com `prefers-reduced-motion`, a rolagem suave, a reprodução automática, o tremor da câmera, o cursor e as entradas animadas são desligados. O conteúdo aparece inteiro.

## Estrutura

```
src/
  config/       siteConfig.ts (empresa, textos, dados) · carConfig.ts (modelo 3D)
  lib/          dynoPhysics.ts (curvas e puxada) · chartRenderer.ts · comparison.ts
  state/        dynoStore.ts · loadStore.ts · bookingStore.ts
  animations/   heroTimeline.ts · scrollAnimations.ts
  hooks/        useQuality · useReducedMotion · useWebGLSupport · useEngineAudio · useMediaQuery
  three/        DynoScene · CarModel · useCarAnimation · DynoRollers · Workshop
                WorkshopLighting · SmokeParticles · DustMotes · CameraController · Effects
  components/   Header · Hero · LoadingScreen · TelemetryHUD · DynoChart · Services
                DynoSection · Results · About · FinalCTA · Contact · Footer
                WhatsAppButton · RpmCursor · SoundToggle …
public/
  models/ · draco/ · textures/ · images/ · audio/
```

## Imagens

As fotos de `public/images/render-*.jpg` e `hero-poster.jpg` são capturas da própria cena 3D, feitas com o gancho de depuração: abra com `?debug=1` e use `__dyno.setProgress(0.6)` e `__dyno.camera({...})` no console (`src/three/debug.ts`). Substitua por fotos da oficina quando houver.

## Créditos

- Modelo 3D: *Ferrari 458 Italia*, por vicent091036 (Sketchfab), licença Creative Commons Attribution. Arquivo e textura de sombra distribuídos com os exemplos do three.js. O crédito aparece no rodapé do site e precisa continuar lá enquanto o modelo for usado.
- Fontes: Space Grotesk, Inter e JetBrains Mono (SIL Open Font License), servidas localmente via Fontsource.

## Depuração da cena

- `?debug=nodes` lista os nodes e materiais do GLB no console.
- `?debug=1` expõe `__dyno` no console: `setProgress(p)`, `camera({...})`, `frames()`.
- `?debug=nan` troca o pós-processamento por um detector que pinta de magenta qualquer pixel NaN, Inf ou acima de 4096. Um único pixel assim faz o bloom apagar a tela inteira; foi com ele que se chegou ao limite de brilho aplicado aos materiais do carro (`clampHighlights` em `CarModel.tsx`).
