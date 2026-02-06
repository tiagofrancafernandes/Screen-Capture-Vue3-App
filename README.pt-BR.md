# Screen Capture App

Changelog: `changelog.md`.
English README: `README.md`.

Aplicativo web em Vue 3 que grava a tela com audio do microfone e audio do sistema (quando suportado) e entrega um arquivo MP4 final (H.264 + AAC). A gravacao e capturada em WebM no navegador e convertida para MP4 usando FFmpeg.wasm.

## Requisitos

- Node.js 18+ (recomendado)
- Navegador moderno baseado em Chromium ou Firefox

## Instalar dependencias

```bash
npm install
```

Esse comando copia os assets do FFmpeg para `public/ffmpeg` para uso local (single-thread e multi-thread).

## Rodar localmente

```bash
npm run dev
```

## Rodar em modo de producao

```bash
npm run build
npm run preview
```

## Navegadores suportados

- Chrome, Edge e outros navegadores baseados em Chromium (recomendado)
- Firefox (a gravacao funciona, mas o audio do sistema depende do SO e da fonte selecionada)

Safari nao e suportado para este fluxo por causa do suporte incompleto a MediaRecorder e captura de tela.

## Como funciona

1. O app usa `getDisplayMedia` para capturar a tela (e o audio do sistema quando disponivel).
2. O app usa `getUserMedia` para capturar o microfone.
3. As faixas de audio sao mixadas com Web Audio API e gravadas com `MediaRecorder` em WebM.
4. Apos finalizar, o FFmpeg.wasm converte WebM para MP4 (H.264 + AAC).

## Controles de conversao para MP4

- Por padrao, a conversao e manual.
- Use o checkbox “Converter automaticamente” para converter apos cada gravacao.
- Use “Converter para MP4” para iniciar a conversao manualmente e depois “Baixar MP4”.

## Limitacoes conhecidas

- A conversao para MP4 roda no navegador e pode ser lenta para gravacoes longas.
- FFmpeg.wasm usa muita CPU e memoria; maquinas fracas podem sofrer.
- A aba deve permanecer aberta durante a conversao.
- A captura de audio do sistema depende do navegador e da fonte selecionada.
- Os assets do core do FFmpeg.wasm sao servidos localmente em `public/ffmpeg`. Se remover esses arquivos, a conversao falha.
- O FFmpeg multi-thread exige cross-origin isolation (COOP/COEP). Sem isso, o app usa o core single-thread.

## Solucao de problemas

- Se os workers do FFmpeg falharem no dev, garanta que a CSP permite `blob:` e que o CDN esta acessivel.
- O otimizador de deps do Vite pode quebrar workers; este projeto exclui `@ffmpeg/ffmpeg` e `@ffmpeg/util` de optimizeDeps.

## Internacionalizacao

- A interface suporta Ingles (`en`) e Portugues (`pt`).
- O idioma escolhido fica salvo em `localStorage`.
- O idioma padrao e: `localStorage`, depois idioma do navegador, depois Ingles.
