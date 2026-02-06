type ConversionResult = {
    blob: Blob;
    source: 'ffmpeg-wasm';
};

const CORE_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

const loadCoreUrls = async () => {
    const { toBlobURL } = await import('@ffmpeg/util');

    const coreURL = await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm');
    const workerURL = await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.worker.js`, 'text/javascript');

    return { coreURL, wasmURL, workerURL };
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

    if ('FFmpeg' in ffmpegModule) {
        const ffmpeg = new ffmpegModule.FFmpeg();
        const { coreURL, wasmURL, workerURL } = await getCoreUrls();
        await ffmpeg.load({ coreURL, wasmURL, workerURL });
        return {
            api: 'modern' as const,
            ffmpeg,
            fetchFile: utilModule.fetchFile,
        };
    }

    if ('createFFmpeg' in ffmpegModule) {
        const legacy = ffmpegModule.createFFmpeg({ log: false });
        const { coreURL, wasmURL, workerURL } = await getCoreUrls();
        await legacy.load({ coreURL, wasmURL, workerURL });
        const fetchFile =
            (ffmpegModule as { fetchFile?: (file: Blob) => Promise<Uint8Array> }).fetchFile ?? utilModule.fetchFile;
        return {
            api: 'legacy' as const,
            ffmpeg: legacy,
            fetchFile,
        };
    }

    throw new Error('FFmpeg module is not supported');
};

let ffmpegInstancePromise: ReturnType<typeof loadFfmpeg> | null = null;

const getFfmpegInstance = async () => {
    if (!ffmpegInstancePromise) {
        ffmpegInstancePromise = loadFfmpeg();
    }

    return ffmpegInstancePromise;
};

const convertViaFfmpegWasm = async (webmBlob: Blob): Promise<Blob> => {
    const { api, ffmpeg, fetchFile } = await getFfmpegInstance();
    const inputName = `input-${Date.now()}.webm`;
    const outputName = `output-${Date.now()}.mp4`;

    if (api === 'modern') {
        await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
        await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-c:a', 'aac', '-movflags', 'faststart', outputName]);
        const data = await ffmpeg.readFile(outputName);
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
        return new Blob([data.buffer], { type: 'video/mp4' });
    }

    ffmpeg.FS('writeFile', inputName, await fetchFile(webmBlob));
    await ffmpeg.run('-i', inputName, '-c:v', 'libx264', '-c:a', 'aac', '-movflags', 'faststart', outputName);
    const data = ffmpeg.FS('readFile', outputName) as Uint8Array;
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);
    return new Blob([data.buffer], { type: 'video/mp4' });
};

export const convertWebmToMp4 = async (webmBlob: Blob): Promise<ConversionResult> => {
    const wasmBlob = await convertViaFfmpegWasm(webmBlob);
    return { blob: wasmBlob, source: 'ffmpeg-wasm' };
};
