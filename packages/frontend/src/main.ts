import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import ProjectDetailView from './views/ProjectDetailView.vue';
import ProjectsView from './views/ProjectsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'projects', component: ProjectsView },
    { path: '/projects/:id', name: 'project', component: ProjectDetailView, props: true },
  ],
});

createApp(App).use(router).mount('#app');
