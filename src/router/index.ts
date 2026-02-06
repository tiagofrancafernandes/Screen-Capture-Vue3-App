import { createRouter, createWebHistory } from 'vue-router';
import RecorderView from '../views/RecorderView.vue';
import ConverterView from '../views/ConverterView.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'recorder',
            component: RecorderView,
        },
        {
            path: '/converter',
            name: 'converter',
            component: ConverterView,
        },
    ],
});

export default router;
