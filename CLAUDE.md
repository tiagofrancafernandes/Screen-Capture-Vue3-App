# Claude Code Instructions

**Non-negotiable rule**
- You must follow `UNIVERSAL-CODE-STYLE-RULES.md` for all code changes.

**Project summary**
- Vue 3 (Composition API) + Vite + TailwindCSS v4.
- Vue Router is used for navigation.
- Screen recording is implemented with `MediaRecorder` and audio mixing via Web Audio API.
- WebM is converted to MP4 with FFmpeg.wasm.
- FFmpeg core assets are served locally from `public/ffmpeg`.
- i18n supports English (`en`) and Portuguese (`pt`) with localStorage persistence.
- Converter route `/converter` lets users convert an existing WebM to MP4 and download a demo file.

**Non-functional constraints**
- Keep code and docs in English.
- Prefer native browser APIs and custom code over new dependencies.
- Avoid introducing new frameworks without explicit approval.
- Do not add global state unless strictly necessary.

**Key files**
- `src/views/RecorderView.vue` for recording UI.
- `src/views/ConverterView.vue` for WebM to MP4 conversion UI.
- `src/composables/useScreenRecorder.ts` for recording lifecycle.
- `src/services/convert.ts` for FFmpeg conversion and progress handling.
- `src/i18n/index.ts` for translations.
- `scripts/copy-ffmpeg-core.mjs` for copying FFmpeg core assets.

**FFmpeg core assets**
- Local assets live under `public/ffmpeg/core` and `public/ffmpeg/core-mt`.
- `postinstall` copies assets from `node_modules` into `public/ffmpeg`.
- Multi-threaded core is used only when cross-origin isolation is available.

**Commands**
- `npm install` (runs `postinstall` to copy FFmpeg assets)
- `npm run dev`
- `npm run build`
- `npm run preview`

**When making changes**
- Update i18n strings for both languages.
- Keep the README and changelog aligned with behavior changes.
- Prefer explicit guards and early returns.
- Keep UI and logic separation clear.
