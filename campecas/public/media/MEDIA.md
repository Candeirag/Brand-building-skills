# Mídia do site — o que fotografar e filmar

Tudo nesta pasta hoje é **placeholder** (claquetes com o nome do arquivo e um vídeo de faíscas gerado por código). Para trocar, basta salvar a foto ou o vídeo real **com o mesmo nome de arquivo** e publicar de novo. Não precisa mexer em código.

Só entram aqui fotos e vídeos feitos na própria Campeças. Nada de banco de imagens.

## Antes de começar

- **Celular serve.** Use a câmera traseira, limpe a lente e grave/fotografe **na horizontal** (exceto o retrato da família, que é vertical).
- **Luz:** a identidade do site é "garagem à noite, luz de cabine de pintura". Prefira ambiente mais escuro com uma luz forte vindo de um lado (um refletor ou a própria luz da cabine). Evite flash e luz chapada de teto.
- **Fundo limpo:** tire do quadro balde, pano, lixo e carro de terceiros.
- **Placas e rostos:** cubra ou desfoque as placas. Só mostre rosto de cliente ou funcionário com autorização.
- **Tripé ou apoio fixo** sempre que a foto fizer par com outra (antes/depois).
- **Peso dos arquivos:** fotos em JPG com até ~400 kB; o vídeo com até ~3 MB. Para reduzir: [squoosh.app](https://squoosh.app) (fotos) e o comando do `ffmpeg` no fim deste arquivo (vídeo).

## Lista de mídias

### Cena 02 — Abertura (hero)

| Arquivo | O que é | Enquadramento | Formato |
| --- | --- | --- | --- |
| `hero.mp4` | Vídeo de fundo, em loop, atrás do título. | Plano fechado e escuro de trabalho acontecendo: faíscas da lixadeira, pistola de pintura contra a luz ou a politriz correndo no capô. Câmera parada (tripé). O assunto deve ficar **do centro para a direita**: o título ocupa o canto inferior esquerdo. | Horizontal 16:9, 1920×1080, **6 a 10 s**, sem áudio. O começo e o fim devem ser parecidos, para o loop não "pular". |
| `hero-poster.jpg` | Imagem que aparece enquanto o vídeo carrega (e no lugar dele para quem desativa animações). | Um quadro do próprio vídeo, o mais bonito. | 1920×1080 (16:9). |

### Cena 03 — Antes → Depois (a seção principal)

A **mesma peça** em quatro momentos. O efeito só funciona se as quatro fotos tiverem **exatamente o mesmo enquadramento**: câmera no tripé, marque a posição do tripé no chão com fita e não mexa no zoom. Mesma luz nas quatro.

| Arquivo | Momento | Enquadramento | Formato |
| --- | --- | --- | --- |
| `transformacao-01-amassado.jpg` | Como o carro chegou. | Plano fechado na peça (porta, para-lama ou lateral), com o amassado no centro do quadro. A peça ocupa a foto inteira, sem chão nem teto. | 1920×1200 (16:10), horizontal. |
| `transformacao-02-preparado.jpg` | Desamassado, com massa, lixa e primer, mascarado para a pintura. | Idêntico ao anterior. | 1920×1200. |
| `transformacao-03-pintado.jpg` | Pintado, ainda sem polimento. | Idêntico. | 1920×1200. |
| `transformacao-04-polido.jpg` | Polido, com o reflexo da luz correndo pela lataria. | Idêntico. Vale posicionar uma luz comprida para aparecer o reflexo. | 1920×1200. |

O texto do site fica no alto à esquerda e na faixa de baixo: deixe o ponto mais importante da peça **no meio** da foto.

### Cena 04 — Serviços (capítulos)

No computador cada foto ocupa **metade da tela, em pé** (o site corta as laterais); no celular vira uma faixa horizontal no alto. Por isso: fotografe na horizontal e mantenha o assunto **no centro**, com folga dos dois lados.

| Arquivo | Capítulo | Enquadramento | Formato |
| --- | --- | --- | --- |
| `lanternagem.jpg` | 01 Lanternagem | Mãos alinhando uma lateral com martelo e tasso. Luz dura vinda de um lado, fundo escuro. | 1600×1000 (16:10). |
| `pintura.jpg` | 02 Pintura | Pintor de costas, pistola em ação, névoa de tinta contra a luz. | 1600×1000. |
| `mecanica.jpg` | 03 Mecânica | Capô aberto, mãos no motor com lanterna. Detalhe fechado, sem rosto. | 1600×1000. |
| `pecas.jpg` | 04 Peças | Prateleira ou bancada com peças novas alinhadas. Plano frontal, simétrico. | 1600×1000. |

### Cena 07 — Galeria (seis trabalhos, antes e depois)

Cada trabalho é um par. O site mostra o **depois** e revela o **antes** quando o visitante passa o mouse (ou abre a foto no celular), então as duas fotos precisam do **mesmo ângulo e da mesma distância**. Dica: tire o "antes" de todo carro que entra, sempre de três quartos, a uns três passos; na entrega, repita do mesmo lugar.

| Arquivos | Sugestão de peça | Enquadramento | Formato |
| --- | --- | --- | --- |
| `trabalho-01-antes.jpg` / `trabalho-01-depois.jpg` | Lateral traseira | O dano no centro; no depois, o reflexo da luz na pintura. | 1400×1050 (4:3), horizontal. |
| `trabalho-02-antes.jpg` / `trabalho-02-depois.jpg` | Para-choque dianteiro | Idem. | 1400×1050. |
| `trabalho-03-antes.jpg` / `trabalho-03-depois.jpg` | Porta do motorista | Idem. | 1400×1050. |
| `trabalho-04-antes.jpg` / `trabalho-04-depois.jpg` | Capô | Idem. | 1400×1050. |
| `trabalho-05-antes.jpg` / `trabalho-05-depois.jpg` | Para-lama | Idem. | 1400×1050. |
| `trabalho-06-antes.jpg` / `trabalho-06-depois.jpg` | Tampa traseira | Idem. | 1400×1050. |

As peças são só sugestão. Se os trabalhos forem outros, troque as legendas em `src/content/site.ts` (bloco `gallery`).

### Cena 08 — Quem faz

| Arquivo | O que é | Enquadramento | Formato |
| --- | --- | --- | --- |
| `familia.jpg` | Retrato de quem toca a oficina. | Na frente da oficina ou junto de um carro pronto, olhando para a câmera. Luz natural, de preferência no fim da tarde. Deixe um pouco de espaço acima das cabeças. **Envie a foto colorida**: o site mostra em preto e branco e devolve a cor conforme a rolagem. | 1400×1750 (4:5), **vertical**. |

### Compartilhamento

| Arquivo | O que é | Enquadramento | Formato |
| --- | --- | --- | --- |
| `og.jpg` | A imagem que aparece quando o link do site é enviado no WhatsApp, Instagram ou Facebook. | Uma foto forte de um carro pronto com o logo, ou a arte atual com a frase "Do amassado ao espelhado.". Texto grande e centralizado: os aplicativos cortam as bordas. | 1200×630, até ~300 kB. |

## Como trocar o vídeo sem pesar o site

Com o vídeo original em mãos (por exemplo `original.mov`), este comando corta em 8 segundos, tira o áudio, reduz para 1080p e comprime:

```bash
ffmpeg -i original.mov -t 8 -an -vf "scale=1920:-2,fps=24" -c:v libx264 -pix_fmt yuv420p -crf 27 -preset slow -movflags +faststart public/media/hero.mp4
```

E este tira o poster do segundo 2 do vídeo:

```bash
ffmpeg -ss 2 -i public/media/hero.mp4 -frames:v 1 -q:v 3 public/media/hero-poster.jpg
```

## Regerar os placeholders

Se precisar recriar as claquetes (por exemplo, para um arquivo novo):

```bash
python3 scripts/make-placeholders.py scripts/fonts
```
