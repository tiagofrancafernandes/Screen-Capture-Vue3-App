export type FfmpegCoreMode = 'single' | 'multi';

type ConversionResult = {
    blob: Blob;
    source: 'ffmpeg-wasm';
    coreMode: FfmpegCoreMode;
};

const CORE_BASE_PATHS = {
    single: 'ffmpeg/core',
    multi: 'ffmpeg/core-mt',
};

const getAssetBaseUrl = () => {
    const base = import.meta.env.BASE_URL ?? '/';
    return base.endsWith('/') ? base : `${base}/`;
};

const toAbsoluteUrl = (path: string) => {
    if (typeof window === 'undefined') {
        return path;
    }
    return new URL(path, window.location.origin).toString();
};

const buildCoreUrls = async (coreBase: string, withWorker: boolean, coreMode: FfmpegCoreMode) => {
    const { toBlobURL } = await import('@ffmpeg/util');
    const coreURL = await toBlobURL(toAbsoluteUrl(`${coreBase}/ffmpeg-core.js`), 'text/javascript');
    const wasmURL = await toBlobURL(toAbsoluteUrl(`${coreBase}/ffmpeg-core.wasm`), 'application/wasm');
    const workerURL = withWorker
        ? await toBlobURL(toAbsoluteUrl(`${coreBase}/ffmpeg-core.worker.js`), 'text/javascript')
        : undefined;

    return { coreURL, wasmURL, workerURL, coreMode };
};

const loadCoreUrls = async () => {
    const assetBase = getAssetBaseUrl();
    const preferMulti = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
    const multiBase = `${assetBase}${CORE_BASE_PATHS.multi}`;
    const singleBase = `${assetBase}${CORE_BASE_PATHS.single}`;
    const first = preferMulti
        ? { base: multiBase, withWorker: true, mode: 'multi' as const }
        : { base: singleBase, withWorker: false, mode: 'single' as const };
    const second = preferMulti
        ? { base: singleBase, withWorker: false, mode: 'single' as const }
        : { base: multiBase, withWorker: true, mode: 'multi' as const };

    try {
        return await buildCoreUrls(first.base, first.withWorker, first.mode);
    } catch (error) {
        return await buildCoreUrls(second.base, second.withWorker, second.mode);
    }
};

let coreUrlsPromise: ReturnType<typeof loadCoreUrls> | null = null;

const getCoreUrls = async () => {
    if (!coreUrlsPromise) {
        coreUrlsPromise = loadCoreUrls();
    }

    return coreUrlsPromise;
};

const loadFfmpeg = async () => {
    const ffmpegModule = await import('@ffmpeg/ffmpeg');
    const utilModule = await import('@ffmpeg/util');

    const ffmpeg = new ffmpegModule.FFmpeg();
    const { coreURL, wasmURL, workerURL, coreMode } = await getCoreUrls();
    await ffmpeg.load({ coreURL, wasmURL, workerURL });

    return {
        ffmpeg,
        fetchFile: utilModule.fetchFile,
        coreMode,
    };
};

let ffmpegInstancePromise: ReturnType<typeof loadFfmpeg> | null = null;

const getFfmpegInstance = async () => {
    if (!ffmpegInstancePromise) {
        ffmpegInstancePromise = loadFfmpeg();
    }

    return ffmpegInstancePromise;
};

const convertViaFfmpegWasm = async (webmBlob: Blob): Promise<{ blob: Blob; coreMode: FfmpegCoreMode }> => {
    const { ffmpeg, fetchFile, coreMode } = await getFfmpegInstance();
    const inputName = `input-${Date.now()}.webm`;
    const outputName = `output-${Date.now()}.mp4`;

    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
    await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-c:a', 'aac', '-movflags', 'faststart', outputName]);
    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const buffer = new Uint8Array(data.byteLength);
    buffer.set(data);
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    return { blob: new Blob([buffer.buffer], { type: 'video/mp4' }), coreMode };
};

export const convertWebmToMp4 = async (webmBlob: Blob): Promise<ConversionResult> => {
    const { blob, coreMode } = await convertViaFfmpegWasm(webmBlob);
    return { blob, source: 'ffmpeg-wasm', coreMode };
};
