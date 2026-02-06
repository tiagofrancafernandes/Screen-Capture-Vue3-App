# Screen Capture App

Read this document in Portuguese: `README.pt-BR.md`.
Changelog: `changelog.md`.

A Vue 3 web app that records your screen with microphone and system audio (when supported), then delivers a final MP4 file (H.264 + AAC). Recording is captured as WebM in the browser and converted to MP4 using FFmpeg.wasm.

## Requirements

- Node.js 18+ (recommended)
- Modern Chromium-based browser or Firefox

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Supported browsers

- Chrome, Edge, and other Chromium-based browsers (recommended)
- Firefox (recording works, but system audio capture depends on OS and user selection)

Safari is not supported for this workflow because of incomplete MediaRecorder and display capture support.

## How it works

1. The app uses `getDisplayMedia` to capture the screen (and system audio when available).
2. The app uses `getUserMedia` to capture microphone audio.
3. Audio tracks are mixed with the Web Audio API and recorded with `MediaRecorder` into WebM.
4. After recording stops, FFmpeg.wasm converts WebM to MP4 (H.264 + AAC).

## MP4 conversion controls

- By default, conversion is manual.
- Use the checkbox “Convert automatically” to convert after each recording.
- Use “Convert to MP4” to start conversion manually, then “Download MP4”.

## Known limitations

- MP4 conversion runs in the browser and can be slow for long recordings.
- FFmpeg.wasm uses significant CPU and memory; weaker machines may struggle.
- The tab must stay open during conversion.
- System audio capture depends on browser and user-selected source.
- FFmpeg.wasm core assets are fetched from a CDN at runtime. Offline use requires hosting those files yourself.

## Troubleshooting

- If FFmpeg workers fail to load in dev, ensure your CSP allows `blob:` and that the CDN is reachable.
- Vite dep optimizer can break FFmpeg workers; this project excludes `@ffmpeg/ffmpeg` and `@ffmpeg/util` from optimizeDeps.

## Internationalization

- UI supports English (`en`) and Portuguese (`pt`).
- The selected language is stored in `localStorage`.
- Default language is `localStorage` value, then browser language, then English.
