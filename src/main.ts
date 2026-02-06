import { createApp } from 'vue';
import './assets/main.css';
import App from './App.vue';
import router from './router';

// import { toast } from 'vue3-toastify';
/* toast(...) */
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const app = createApp(App);
const toastOptions: ToastContainerOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    newestOnTop: true,
    closeOnClick: true,
    rtl: false,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    theme: 'light',
};

app.use(Vue3Toastify, toastOptions);
app.use(router);

app.mount('#app');
