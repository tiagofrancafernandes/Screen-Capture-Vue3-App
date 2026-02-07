import { computed, onBeforeUnmount, ref } from 'vue';
import { convertWebmToMp4, type FfmpegCoreMode } from '../services/convert';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'converting' | 'ready' | 'error';
export type RecorderError = 'unsupported' | 'start_failed' | 'conversion_failed';

type RecorderState = {
    displayStream: MediaStream | null;
    micStream: MediaStream | null;
    audioContext: AudioContext | null;
    recorder: MediaRecorder | null;
};

const createFilenameBase = () => {
    const now = new Date();
    const pad = (value: number | string | null) => String(value || '').padStart(2, '0');
    return `recording-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
        now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const pickMimeType = () => {
    const candidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
    ];

    return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

const stopTracks = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
};

export const useScreenRecorder = () => {
    const status = ref<RecordingStatus>('idle');
    const errorKey = ref<RecorderError | null>(null);
    const elapsedMs = ref(0);
    const webmBlob = ref<Blob | null>(null);
    const mp4Blob = ref<Blob | null>(null);
    const webmUrl = ref<string | null>(null);
    const mp4Url = ref<string | null>(null);
    const filenameBase = ref<string>('recording');
    const conversionSource = ref<{ engine: 'ffmpeg-wasm'; coreMode: FfmpegCoreMode } | null>(null);
    const conversionProgress = ref<number | null>(null);

    let chunks: BlobPart[] = [];
    let timerId: number | null = null;
    let startedAt = 0;
    let pausedAt = 0;
    let pausedTotal = 0;

    const state: RecorderState = {
        displayStream: null,
        micStream: null,
        audioContext: null,
        recorder: null,
    };

    const isRecording = computed(() => status.value === 'recording');
    const isPaused = computed(() => status.value === 'paused');
    const isConverting = computed(() => status.value === 'converting');
    const isReady = computed(() => status.value === 'ready');
    const hasWebm = computed(() => Boolean(webmBlob.value));
    const hasMp4 = computed(() => Boolean(mp4Blob.value));

    const downloadUrl = computed(() => mp4Url.value ?? webmUrl.value);
    const downloadName = computed(() => {
        if (mp4Url.value) {
            return `${filenameBase.value}.mp4`;
        }

        return `${filenameBase.value}.webm`;
    });

    const revokeUrl = (url: string | null) => {
        if (url) {
            URL.revokeObjectURL(url);
        }
    };

    const setObjectUrl = (target: typeof webmUrl, blob: Blob | null) => {
        revokeUrl(target.value);
        target.value = blob ? URL.createObjectURL(blob) : null;
    };

    const resetMediaState = () => {
        chunks = [];
        webmBlob.value = null;
        mp4Blob.value = null;
        conversionSource.value = null;
        conversionProgress.value = null;
        setObjectUrl(webmUrl, null);
        setObjectUrl(mp4Url, null);
    };

    const clearTimer = () => {
        if (timerId !== null) {
            window.clearInterval(timerId);
            timerId = null;
        }
    };

    const startTimer = () => {
        startedAt = Date.now();
        pausedAt = 0;
        pausedTotal = 0;
        elapsedMs.value = 0;

        clearTimer();
        timerId = window.setInterval(() => {
            const now = Date.now();
            const reference = pausedAt > 0 ? pausedAt : now;
            elapsedMs.value = reference - startedAt - pausedTotal;
        }, 250);
    };

    const pauseTimer = () => {
        pausedAt = Date.now();
    };

    const resumeTimer = () => {
        if (pausedAt > 0) {
            pausedTotal += Date.now() - pausedAt;
            pausedAt = 0;
        }
    };

    const stopTimer = () => {
        clearTimer();
    };

    const cleanupStreams = () => {
        stopTracks(state.displayStream);
        stopTracks(state.micStream);
        if (state.audioContext) {
            state.audioContext.close();
        }
        state.displayStream = null;
        state.micStream = null;
        state.audioContext = null;
    };

    const createMixedStream = async (displayStream: MediaStream, micStream: MediaStream) => {
        const mixedStream = new MediaStream();

        displayStream.getVideoTracks().forEach((track) => mixedStream.addTrack(track));

        const audioTracks: MediaStreamTrack[] = [];
        const hasDisplayAudio = displayStream.getAudioTracks().length > 0;
        const hasMicAudio = micStream.getAudioTracks().length > 0;

        if (hasDisplayAudio || hasMicAudio) {
            state.audioContext = new AudioContext();
            await state.audioContext.resume();

            const destination = state.audioContext.createMediaStreamDestination();

            if (hasDisplayAudio) {
                const systemSource = new MediaStreamAudioSourceNode(state.audioContext, {
                    mediaStream: displayStream,
                });
                systemSource.connect(destination);
            }

            if (hasMicAudio) {
                const micSource = new MediaStreamAudioSourceNode(state.audioContext, {
                    mediaStream: micStream,
                });
                micSource.connect(destination);
            }

            audioTracks.push(...destination.stream.getAudioTracks());
        }

        audioTracks.forEach((track) => mixedStream.addTrack(track));

        return mixedStream;
    };

    const finalizeRecording = async () => {
        const webm = new Blob(chunks, { type: 'video/webm' });
        webmBlob.value = webm;
        setObjectUrl(webmUrl, webm);
        status.value = 'ready';
    };

    const convertToMp4 = async () => {
        if (!webmBlob.value || status.value === 'converting') {
            return;
        }

        status.value = 'converting';
        errorKey.value = null;
        conversionProgress.value = 0;

        try {
            const result = await convertWebmToMp4(webmBlob.value, {
                onProgress: (ratio) => {
                    conversionProgress.value = Math.min(Math.max(ratio, 0), 1);
                },
            });
            mp4Blob.value = result.blob;
            conversionSource.value = { engine: result.source, coreMode: result.coreMode };
            setObjectUrl(mp4Url, result.blob);
            status.value = 'ready';
        } catch (error) {
            errorKey.value = 'conversion_failed';
            status.value = 'ready';
        } finally {
            if (status.value !== 'converting') {
                conversionProgress.value = null;
            }
        }
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
            status.value = 'error';
            errorKey.value = 'unsupported';
            return;
        }

        if (status.value === 'recording' || status.value === 'paused' || status.value === 'converting') {
            return;
        }

        resetMediaState();
        errorKey.value = null;
        filenameBase.value = createFilenameBase();

        try {
            state.displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            state.micStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            const mixedStream = await createMixedStream(state.displayStream, state.micStream);
            const mimeType = pickMimeType();
            state.recorder = mimeType ? new MediaRecorder(mixedStream, { mimeType }) : new MediaRecorder(mixedStream);

            chunks = [];
            state.recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            state.recorder.onstop = async () => {
                stopTimer();
                cleanupStreams();
                await finalizeRecording();
            };

            state.recorder.onerror = () => {
                status.value = 'error';
                errorKey.value = 'start_failed';
                stopTimer();
                cleanupStreams();
            };

            state.recorder.onpause = () => {
                status.value = 'paused';
            };

            state.recorder.onresume = () => {
                status.value = 'recording';
            };

            state.displayStream.getVideoTracks().forEach((track) => {
                track.addEventListener('ended', () => {
                    if (state.recorder && state.recorder.state !== 'inactive') {
                        state.recorder.stop();
                    }
                });
            });

            startTimer();
            status.value = 'recording';
            state.recorder.start(1000);
        } catch (error) {
            status.value = 'error';
            errorKey.value = 'start_failed';
            cleanupStreams();
        }
    };

    const pauseRecording = () => {
        if (state.recorder?.state === 'recording') {
            state.recorder.pause();
            pauseTimer();
        }
    };

    const resumeRecording = () => {
        if (state.recorder?.state === 'paused') {
            state.recorder.resume();
            resumeTimer();
        }
    };

    const stopRecording = () => {
        if (state.recorder && state.recorder.state !== 'inactive') {
            state.recorder.stop();
        }
    };

    const resetRecording = () => {
        stopTimer();
        cleanupStreams();
        resetMediaState();
        status.value = 'idle';
        errorKey.value = null;
        elapsedMs.value = 0;
    };

    onBeforeUnmount(() => {
        resetRecording();
    });

    return {
        status,
        errorKey,
        elapsedMs,
        conversionSource,
        conversionProgress,
        isRecording,
        isPaused,
        isConverting,
        isReady,
        hasWebm,
        hasMp4,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        resetRecording,
        convertToMp4,
        downloadUrl,
        downloadName,
        webmUrl,
        mp4Url,
    };
};
