<script setup lang="ts">
import { computed, provide, ref, watch, watchEffect } from 'vue';
import { useI18n, type Locale } from './i18n';

const { locale, setLocale, t, availableLocales } = useI18n();

const localeModel = computed<Locale>({
    get: () => locale.value,
    set: (value) => setLocale(value),
});

watch(locale, (value) => {
    document.documentElement.lang = value;
});

const titlePrefix = ref('');
provide('titlePrefix', titlePrefix);

const updateMetaTag = (selector: string, content: string) => {
    const element = document.querySelector<HTMLMetaElement>(selector);
    if (element) {
        element.setAttribute('content', content);
    }
};

watchEffect(() => {
    document.title = `${titlePrefix.value}${t('appTitle')}`;
    updateMetaTag('meta[name="description"]', t('appDescription'));
    updateMetaTag('meta[property="og:title"]', t('appTitle'));
    updateMetaTag('meta[property="og:description"]', t('appDescription'));
    updateMetaTag('meta[name="twitter:title"]', t('appTitle'));
    updateMetaTag('meta[name="twitter:description"]', t('appDescription'));
});
</script>

<template>
    <div class="min-h-screen bg-slate-950 text-slate-100">
        <div class="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
            <header class="flex flex-wrap items-center justify-between gap-4">
                <div class="space-y-2">
                    <h1 class="text-3xl font-semibold tracking-tight">{{ t('appTitle') }}</h1>
                    <p class="text-sm text-slate-300">{{ t('appSubtitle') }}</p>
                </div>
                <div class="flex items-center gap-2">
                    <label class="text-xs uppercase tracking-wide text-slate-400" for="lang">
                        {{ t('languageLabel') }}
                    </label>
                    <select
                        id="lang"
                        v-model="localeModel"
                        class="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                        <option v-for="option in availableLocales" :key="option" :value="option">
                            {{ option.toUpperCase() }}
                        </option>
                    </select>
                </div>
            </header>

            <nav class="flex flex-wrap gap-2 text-sm">
                <RouterLink to="/" v-slot="{ isActive }">
                    <span
                        class="rounded-full px-4 py-2 font-semibold transition"
                        :class="
                            isActive
                                ? 'bg-emerald-500 text-slate-950'
                                : 'border border-slate-700 text-slate-200 hover:border-slate-500'
                        "
                    >
                        {{ t('navRecorder') }}
                    </span>
                </RouterLink>
                <RouterLink to="/converter" v-slot="{ isActive }">
                    <span
                        class="rounded-full px-4 py-2 font-semibold transition"
                        :class="
                            isActive
                                ? 'bg-indigo-500 text-slate-950'
                                : 'border border-slate-700 text-slate-200 hover:border-slate-500'
                        "
                    >
                        {{ t('navConverter') }}
                    </span>
                </RouterLink>
            </nav>

            <RouterView />
        </div>
    </div>
</template>
