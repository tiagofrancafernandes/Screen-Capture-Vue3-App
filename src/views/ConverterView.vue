<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from '../i18n';
import { convertWebmToMp4, type FfmpegCoreMode } from '../services/convert';

const { t } = useI18n();

type ConverterStatus = 'idle' | 'converting' | 'ready' | 'error';

const status = ref<ConverterStatus>('idle');
const errorMessage = ref<string | null>(null);
const webmFile = ref<File | null>(null);
const webmUrl = ref<string | null>(null);
const mp4Url = ref<string | null>(null);
const mp4Name = ref('converted.mp4');
const coreMode = ref<FfmpegCoreMode | null>(null);
const conversionProgress = ref<number | null>(null);

const revokeUrl = (url: string | null) => {
    if (url) {
        URL.revokeObjectURL(url);
    }
};

const resetOutput = () => {
    revokeUrl(mp4Url.value);
    mp4Url.value = null;
    coreMode.value = null;
    conversionProgress.value = null;
    status.value = 'idle';
    errorMessage.value = null;
};

const setWebmFile = (file: File | null) => {
    resetOutput();
    revokeUrl(webmUrl.value);
    webmFile.value = file;

    if (!file) {
        webmUrl.value = null;
        return;
    }

    webmUrl.value = URL.createObjectURL(file);
    const base = file.name.replace(/\.webm$/i, '');
    mp4Name.value = `${base || 'converted'}.mp4`;
};

const onFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    setWebmFile(file);
};

const convert = async () => {
    if (!webmFile.value || status.value === 'converting') {
        return;
    }

    status.value = 'converting';
    errorMessage.value = null;
    conversionProgress.value = 0;

    try {
        const result = await convertWebmToMp4(webmFile.value, {
            onProgress: (ratio) => {
                conversionProgress.value = Math.min(Math.max(ratio, 0), 1);
            },
        });
        mp4Url.value = URL.createObjectURL(result.blob);
        coreMode.value = result.coreMode;
        status.value = 'ready';
    } catch (error) {
        status.value = 'error';
        errorMessage.value = t('converterError');
    } finally {
        if (status.value !== 'converting') {
            conversionProgress.value = null;
        }
    }
};

const clearFile = () => {
    setWebmFile(null);
};

const canConvert = computed(() => Boolean(webmFile.value) && status.value !== 'converting');
const canClear = computed(() => Boolean(webmFile.value) && status.value !== 'converting');
const ffmpegModeLabel = computed(() => {
    if (!coreMode.value) {
        return null;
    }

    return coreMode.value === 'multi' ? t('ffmpegModeMulti') : t('ffmpegModeSingle');
});

const progressPercent = computed(() => {
    if (conversionProgress.value === null) {
        return null;
    }
    return Math.round(conversionProgress.value * 100);
});

onBeforeUnmount(() => {
    revokeUrl(webmUrl.value);
    revokeUrl(mp4Url.value);
});
</script>

<template>
    <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/20">
        <div class="space-y-2">
            <h2 class="text-2xl font-semibold">{{ t('converterTitle') }}</h2>
            <p class="text-sm text-slate-300">{{ t('converterSubtitle') }}</p>
        </div>

        <div class="mt-6 grid gap-4">
            <label class="text-sm text-slate-200">
                {{ t('converterSelect') }}
                <input
                    class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    type="file"
                    accept="video/webm"
                    @change="onFileChange"
                />
            </label>

            <div class="flex flex-wrap items-center gap-3">
                <button
                    class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!canConvert"
                    @click="convert"
                >
                    {{ t('convertMp4') }}
                </button>
                <button
                    class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!canClear"
                    @click="clearFile"
                >
                    {{ t('converterClear') }}
                </button>
                <a
                    href="/demo-files/demo-webm.webm"
                    download
                    class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                >
                    {{ t('converterDemoDownload') }}
                </a>
                <span v-if="ffmpegModeLabel" class="text-xs uppercase tracking-wide text-slate-500">
                    {{ ffmpegModeLabel }}
                </span>
            </div>

            <div
                v-if="status === 'converting'"
                class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100"
            >
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span>{{ t('convertingNotice') }}</span>
                    <span v-if="progressPercent !== null" class="text-xs text-amber-200">{{ progressPercent }}%</span>
                </div>
                <div
                    v-if="progressPercent !== null"
                    class="mt-3 h-2 w-full overflow-hidden rounded-full bg-amber-500/20"
                >
                    <div
                        class="h-full rounded-full bg-amber-400 transition-[width] duration-200"
                        :style="{ width: `${progressPercent}%` }"
                    ></div>
                </div>
            </div>

            <div
                v-if="errorMessage"
                class="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100"
            >
                {{ errorMessage }}
            </div>

            <div
                v-if="status === 'ready'"
                class="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100"
            >
                {{ t('converterReady') }}
            </div>

            <a
                v-if="mp4Url"
                :href="mp4Url"
                :download="mp4Name"
                class="inline-flex w-fit rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
                {{ t('downloadMp4') }}
            </a>
        </div>
    </section>

    <section
        v-if="webmUrl || mp4Url"
        class="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/20"
    >
        <div class="flex items-center justify-between">
            <p class="text-xs uppercase tracking-wide text-slate-400">{{ t('converterPreview') }}</p>
        </div>
        <video
            class="mt-4 w-full rounded-lg border border-slate-800 bg-slate-950"
            controls
            playsinline
            :src="mp4Url ?? webmUrl ?? undefined"
        ></video>
    </section>
</template>
