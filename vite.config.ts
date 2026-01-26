import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            '@@': path.resolve(__dirname, './'),
            // '@': path.resolve(__dirname, './src'), // Mapeia '@' para o diretório 'src'
            // '@components': path.resolve(__dirname, './src/components'), // Alias para o diretório de componentes
            // '@utils': path.resolve(__dirname, './src/utils'), // Alias para o diretório de utilitários

            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
            '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
            '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
            '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
            '@router': fileURLToPath(new URL('./src/router', import.meta.url)),
            '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
            '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
            '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
            '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
            '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
            '@public': fileURLToPath(new URL('./public', import.meta.url)),
        },
    },
    server: {
        host: '0.0.0.0',
        // allowedHosts: true, // Any host
        allowedHosts: [
            'localhost',
            'app.tiagofranca.com',
            'app.local.tiagofranca.com',
            'app.hml.tiagofranca.com',
            // ... other hosts
        ],
    },
});
