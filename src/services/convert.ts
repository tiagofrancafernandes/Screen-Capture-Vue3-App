type ConversionResult = {
    blob: Blob;
    source: 'ffmpeg-wasm';
};

const CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm';

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

    const ffmpeg = new ffmpegModule.FFmpeg();
    const { coreURL, wasmURL, workerURL } = await getCoreUrls();
    await ffmpeg.load({ coreURL, wasmURL, workerURL });

    return {
        ffmpeg,
        fetchFile: utilModule.fetchFile,
    };
};

let ffmpegInstancePromise: ReturnType<typeof loadFfmpeg> | null = null;

const getFfmpegInstance = async () => {
    if (!ffmpegInstancePromise) {
        ffmpegInstancePromise = loadFfmpeg();
    }

    return ffmpegInstancePromise;
};

const convertViaFfmpegWasm = async (webmBlob: Blob): Promise<Blob> => {
    const { ffmpeg, fetchFile } = await getFfmpegInstance();
    const inputName = `input-${Date.now()}.webm`;
    const outputName = `output-${Date.now()}.mp4`;

    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
    await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-c:a', 'aac', '-movflags', 'faststart', outputName]);
    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const buffer = new Uint8Array(data.byteLength);
    buffer.set(data);
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    return new Blob([buffer.buffer], { type: 'video/mp4' });
};

export const convertWebmToMp4 = async (webmBlob: Blob): Promise<ConversionResult> => {
    const wasmBlob = await convertViaFfmpegWasm(webmBlob);
    return { blob: wasmBlob, source: 'ffmpeg-wasm' };
};
