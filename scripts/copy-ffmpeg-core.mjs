import { cp, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));
const CORE_SOURCES = [
    {
        source: join(ROOT_DIR, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm'),
        target: join(ROOT_DIR, 'public', 'ffmpeg', 'core'),
        label: '@ffmpeg/core',
        files: ['ffmpeg-core.js', 'ffmpeg-core.wasm'],
    },
    {
        source: join(ROOT_DIR, 'node_modules', '@ffmpeg', 'core-mt', 'dist', 'esm'),
        target: join(ROOT_DIR, 'public', 'ffmpeg', 'core-mt'),
        label: '@ffmpeg/core-mt',
        files: ['ffmpeg-core.js', 'ffmpeg-core.wasm', 'ffmpeg-core.worker.js'],
    },
];

const ensureSource = async (sourceDir) => {
    const stats = await stat(sourceDir).catch(() => null);
    return Boolean(stats);
};

const ensureFiles = async (sourceDir, label, files) => {
    await Promise.all(
        files.map(async (filename) => {
            const filePath = join(sourceDir, filename);
            const stats = await stat(filePath).catch(() => null);
            if (!stats) {
                throw new Error(`Missing ${filename} in ${label} at ${sourceDir}.`);
            }
        })
    );
};

const copyAssets = async () => {
    let copiedAny = false;

    await Promise.all(
        CORE_SOURCES.map(async ({ source, target, label, files }) => {
            const exists = await ensureSource(source);
            if (!exists) {
                return;
            }

            await ensureFiles(source, label, files);
            await mkdir(target, { recursive: true });
            await Promise.all(files.map((filename) => cp(join(source, filename), join(target, filename))));
            copiedAny = true;
        })
    );

    if (!copiedAny) {
        throw new Error(
            'FFmpeg core assets were not found. Install @ffmpeg/core and/or @ffmpeg/core-mt before running postinstall.'
        );
    }
};

copyAssets().catch((error) => {
    console.error(error);
    process.exit(1);
});
