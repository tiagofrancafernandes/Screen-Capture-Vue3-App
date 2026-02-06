<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n, type MessageKey } from '../i18n';
import { useScreenRecorder } from '../composables/useScreenRecorder';

const { t } = useI18n();
const titlePrefix = inject('titlePrefix', ref('')) as { value: string };

const {
    status,
    errorKey,
    elapsedMs,
    conversionSource,
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
    downloadName,
    webmUrl,
    mp4Url,
} = useScreenRecorder();

const AUTO_CONVERT_KEY = 'autoConvertMp4';
const autoConvert = ref(false);

onMounted(() => {
    const stored = localStorage.getItem(AUTO_CONVERT_KEY);
    autoConvert.value = stored === 'true';
});

watch(autoConvert, (value) => {
    localStorage.setItem(AUTO_CONVERT_KEY, String(value));
});

watch(
    () => status.value,
    (value) => {
        if (value !== 'ready') {
            return;
        }

        if (!autoConvert.value || hasMp4.value || isConverting.value || !hasWebm.value) {
            return;
        }

        convertToMp4();
    }
);

const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const statusLabel = computed(() => {
    const mapping: Record<typeof status.value, MessageKey> = {
        idle: 'statusIdle',
        recording: 'statusRecording',
        paused: 'statusPaused',
        converting: 'statusConverting',
        ready: 'statusReady',
        error: 'statusError',
    };

    return t(mapping[status.value]);
});

const errorMessage = computed(() => {
    if (!errorKey.value) {
        return null;
    }

    const mapping: Record<typeof errorKey.value, MessageKey> = {
        unsupported: 'browserNotSupported',
        start_failed: 'errorStart',
        conversion_failed: 'errorConvert',
    };

    return t(mapping[errorKey.value]);
});

const formattedElapsed = computed(() => formatDuration(elapsedMs.value));

const canStart = computed(() => ['idle', 'ready', 'error'].includes(status.value));
const canPause = computed(() => isRecording.value);
const canResume = computed(() => isPaused.value);
const canStop = computed(() => isRecording.value || isPaused.value);
const canReset = computed(() => status.value !== 'recording' && status.value !== 'paused' && !isConverting.value);
const canConvert = computed(
    () => hasWebm.value && !hasMp4.value && !isConverting.value && !isRecording.value && !isPaused.value
);

const webmDownloadName = computed(() =>
    hasMp4.value ? downloadName.value.replace(/\.mp4$/, '.webm') : downloadName.value
);

const ffmpegModeLabel = computed(() => {
    if (!conversionSource.value) {
        return null;
    }

    return conversionSource.value.coreMode === 'multi' ? t('ffmpegModeMulti') : t('ffmpegModeSingle');
});

const recTitleIcon = ref('');
let titleBlinkId: number | null = null;

const stopTitleBlink = () => {
    if (titleBlinkId !== null) {
        window.clearInterval(titleBlinkId);
        titleBlinkId = null;
    }
};

watch(
    [isRecording, isPaused],
    ([recording, paused]) => {
        stopTitleBlink();

        if (recording) {
            let on = true;
            const update = () => {
                const value = on ? '● ' : '  ';
                recTitleIcon.value = value;
                titlePrefix.value = value;
                on = !on;
            };
            update();
            titleBlinkId = window.setInterval(update, 650);
            return;
        }

        if (paused) {
            recTitleIcon.value = '⏸ ';
            titlePrefix.value = recTitleIcon.value;
            return;
        }

        recTitleIcon.value = '';
        titlePrefix.value = '';
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    stopTitleBlink();
    titlePrefix.value = '';
});
</script>

<template>
    <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/20">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">{{ t('statusLabel') }}</p>
                <div class="mt-2 flex items-center gap-3">
                    <div class="flex items-center gap-2">
                        <span
                            class="h-2.5 w-2.5 rounded-full"
                            :class="isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'"
                        ></span>
                        <span class="text-xs uppercase tracking-widest text-slate-400">Rec</span>
                    </div>
                    <p class="text-xl font-semibold">{{ statusLabel }}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-xs uppercase tracking-wide text-slate-400">{{ t('timerLabel') }}</p>
                <p class="text-xl font-semibold tabular-nums">{{ formattedElapsed }}</p>
            </div>
        </div>

        <label class="mt-4 flex items-center gap-3 text-sm text-slate-300">
            <input
                v-model="autoConvert"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-400"
            />
            {{ t('autoConvertLabel') }}
        </label>

        <div
            v-if="isConverting"
            class="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100"
        >
            {{ t('convertingNotice') }}
        </div>

        <div
            v-if="errorMessage"
            class="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100"
        >
            {{ errorMessage }}
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
                class="rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!canStart"
                @click="startRecording"
            >
                {{ t('start') }}
            </button>
            <button
                class="rounded-lg bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!canPause"
                @click="pauseRecording"
            >
                {{ t('pause') }}
            </button>
            <button
                class="rounded-lg bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!canResume"
                @click="resumeRecording"
            >
                {{ t('resume') }}
            </button>
            <button
                class="rounded-lg bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!canStop"
                @click="stopRecording"
            >
                {{ t('stop') }}
            </button>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
                class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!canReset"
                @click="resetRecording"
            >
                {{ t('reset') }}
            </button>
            <button
                class="rounded-lg border border-indigo-500/60 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!canConvert"
                @click="convertToMp4"
            >
                {{ t('convertMp4') }}
            </button>
            <a
                v-if="hasMp4 && mp4Url"
                :href="mp4Url"
                :download="downloadName"
                class="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
                {{ t('downloadMp4') }}
            </a>
            <a
                v-if="hasWebm && webmUrl && !hasMp4"
                :href="webmUrl"
                :download="webmDownloadName"
                class="rounded-lg border border-slate-600/70 bg-slate-800/40 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/70"
            >
                {{ t('downloadWebm') }}
            </a>
            <span v-if="isReady" class="text-sm text-slate-300">{{ t('downloadReady') }}</span>
            <span v-if="ffmpegModeLabel" class="text-xs uppercase tracking-wide text-slate-500">
                {{ ffmpegModeLabel }}
            </span>
        </div>
    </section>

    <section class="mt-6 grid gap-3 text-sm text-slate-300">
        <p>{{ t('permissionsHint') }}</p>
        <p>{{ t('systemAudioHint') }}</p>
        <p>{{ t('conversionHint') }}</p>
    </section>

    <section
        v-if="mp4Url || webmUrl"
        class="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/20"
    >
        <div class="flex items-center justify-between">
            <p class="text-xs uppercase tracking-wide text-slate-400">{{ t('previewLabel') }}</p>
        </div>
        <video
            class="mt-4 w-full rounded-lg border border-slate-800 bg-slate-950"
            controls
            playsinline
            :src="mp4Url ?? webmUrl"
        ></video>
    </section>
</template>
