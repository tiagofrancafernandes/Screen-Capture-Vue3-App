import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Mapeia '@' para o diretório 'src'
      '@components': path.resolve(__dirname, './src/components'), // Alias para o diretório de componentes
      '@utils': path.resolve(__dirname, './src/utils'), // Alias para o diretório de utilitários
    },
  },
});
