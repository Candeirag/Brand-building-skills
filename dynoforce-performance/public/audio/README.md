# Áudio do motor

Por padrão o som do motor é sintetizado no navegador (Web Audio) e esta pasta fica vazia.

Para usar uma gravação própria ou licenciada:

1. Coloque aqui um loop curto e contínuo do motor numa rotação fixa (por exemplo `engine-loop.mp3`, gravado a 3.000 rpm).
2. Em `src/config/siteConfig.ts`, defina `audioConfig.src = 'audio/engine-loop.mp3'` e `audioConfig.sampleRpm = 3000`.

O site muda o tom do loop conforme o RPM da cena. Se o arquivo não carregar, o motor sintetizado entra no lugar.
