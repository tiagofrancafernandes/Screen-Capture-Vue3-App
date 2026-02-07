# Codex Agent Instructions

**Non-negotiable rule**
- You must follow `UNIVERSAL-CODE-STYLE-RULES.md` for all code changes.

**Project context**
- Vue 3 (Composition API) + Vite + TailwindCSS v4.
- Vue Router provides `/` (Recorder) and `/converter` (WebM to MP4 converter).
- Screen capture uses `getDisplayMedia`, `getUserMedia`, and `MediaRecorder`.
- Audio is mixed with Web Audio API.
- Conversion uses FFmpeg.wasm with local core assets in `public/ffmpeg`.
- i18n in `src/i18n/index.ts` supports `en` and `pt` and persists locale in localStorage.

**Core responsibilities**
- Preserve the recording flow and conversion reliability.
- Keep conversion progress reporting intact.
- Maintain the demo WebM download at `public/demo-files/demo-webm.webm`.

**Technical guardrails**
- Avoid new dependencies unless strictly required.
- Do not introduce global state without justification.
- Keep UI logic in views and processing in composables/services.

**FFmpeg details**
- `scripts/copy-ffmpeg-core.mjs` copies assets on `postinstall`.
- Single-thread core does not use a worker file.
- Multi-thread core requires cross-origin isolation.

**Commands**
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

**Documentation**
- Update `README.md`, `README.pt-BR.md`, and `changelog.md` when behavior changes.
- Keep documentation in English, except `README.pt-BR.md`.
