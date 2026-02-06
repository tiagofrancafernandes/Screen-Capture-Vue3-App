import { ref } from 'vue';

export const messages = {
    en: {
        appTitle: 'Screen Recorder',
        appSubtitle: 'Record your screen with system and microphone audio.',
        appDescription:
            'Record your screen with system and microphone audio, then export an MP4 file with FFmpeg.wasm.',
        start: 'Start Recording',
        pause: 'Pause',
        resume: 'Resume',
        stop: 'Stop',
        downloadMp4: 'Download MP4',
        downloadWebm: 'Download WebM',
        statusLabel: 'Status',
        statusIdle: 'Idle',
        statusRecording: 'Recording',
        statusPaused: 'Paused',
        statusConverting: 'Converting to MP4...',
        statusReady: 'Ready',
        statusError: 'Error',
        timerLabel: 'Elapsed',
        permissionsHint: 'You will be asked to share a screen and allow microphone access.',
        systemAudioHint: 'System audio capture depends on browser support and the selected source.',
        conversionHint: 'MP4 conversion happens after you stop recording and may take a while.',
        browserNotSupported: 'This browser does not support screen recording.',
        errorStart: 'Unable to start recording. Please check permissions and try again.',
        errorConvert: 'Failed to convert to MP4. A WebM file is available instead.',
        languageLabel: 'Language',
        downloadReady: 'Your recording is ready.',
        reset: 'Clear Recording',
        convertingNotice: 'Converting WebM to MP4. Keep this tab open.',
        autoConvertLabel: 'Convert automatically',
        convertMp4: 'Convert to MP4',
        previewLabel: 'Preview',
    },
    pt: {
        appTitle: 'Gravador de Tela',
        appSubtitle: 'Grave sua tela com áudio do sistema e do microfone.',
        appDescription: 'Grave a tela com áudio do sistema e do microfone e exporte um arquivo MP4 com FFmpeg.wasm.',
        start: 'Iniciar Gravação',
        pause: 'Pausar',
        resume: 'Retomar',
        stop: 'Parar',
        downloadMp4: 'Baixar MP4',
        downloadWebm: 'Baixar WebM',
        statusLabel: 'Status',
        statusIdle: 'Ocioso',
        statusRecording: 'Gravando',
        statusPaused: 'Pausado',
        statusConverting: 'Convertendo para MP4...',
        statusReady: 'Pronto',
        statusError: 'Erro',
        timerLabel: 'Tempo',
        permissionsHint: 'Voce precisara compartilhar a tela e permitir o microfone.',
        systemAudioHint: 'O áudio do sistema depende do navegador e da fonte selecionada.',
        conversionHint: 'A conversão para MP4 acontece apos parar e pode demorar.',
        browserNotSupported: 'Este navegador nao suporta gravação de tela.',
        errorStart: 'Nao foi possivel iniciar a gravação. Verifique as permissoes.',
        errorConvert: 'Falha ao converter para MP4. Um arquivo WebM foi gerado.',
        languageLabel: 'Idioma',
        downloadReady: 'Sua gravação esta pronta.',
        reset: 'Limpar Gravação',
        convertingNotice: 'Convertendo WebM para MP4. Mantenha esta aba aberta.',
        autoConvertLabel: 'Converter automaticamente',
        convertMp4: 'Converter para MP4',
        previewLabel: 'Previa',
    },
} as const;

export type Locale = keyof typeof messages;
export type MessageKey = keyof typeof messages.en;

const STORAGE_KEY = 'locale';

const resolveBrowserLocale = (): Locale => {
    if (typeof navigator === 'undefined') {
        return 'en';
    }

    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    const normalized = languages.filter(Boolean).map((language) => language.toLowerCase());

    if (normalized.some((language) => language.startsWith('pt'))) {
        return 'pt';
    }

    return 'en';
};

const getInitialLocale = (): Locale => {
    if (typeof localStorage === 'undefined') {
        return resolveBrowserLocale();
    }

    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in messages) {
        return stored;
    }

    return resolveBrowserLocale();
};

const locale = ref<Locale>(getInitialLocale());

export const useI18n = () => {
    const setLocale = (value: Locale) => {
        if (value === locale.value) {
            return;
        }

        locale.value = value;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, value);
        }
    };

    const t = (key: MessageKey) => messages[locale.value][key];

    return {
        locale,
        setLocale,
        t,
        availableLocales: Object.keys(messages) as Locale[],
    };
};
