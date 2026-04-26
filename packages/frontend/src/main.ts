import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import './index.css';
import App from './App.vue';
import MainLayout from './components/layout/MainLayout.vue';
import DashboardView from './views/DashboardView.vue';
import TaskListView from './views/TaskListView.vue';
import KanbanView from './views/KanbanView.vue';
import TaskDetailView from './views/TaskDetailView.vue';
import NotesOverview from './views/NotesOverview.vue';
import ProjectDetailView from './views/ProjectDetailView.vue';
import ProjectsView from './views/ProjectsView.vue';
import SettingsView from './views/SettingsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'tasks', name: 'task-list', component: TaskListView },
        { path: 'kanban', name: 'kanban', component: KanbanView },
        { path: 'tasks/:id', name: 'task-detail', component: TaskDetailView, alias: '/task/:id' },
        { path: 'notes', name: 'notes-overview', component: NotesOverview },
        { path: 'settings', name: 'settings', component: SettingsView },
      ]
    },
    // Old routes kept for reference
    { path: '/projects-old', name: 'projects', component: ProjectsView },
    { path: '/projects-old/:id', name: 'project', component: ProjectDetailView, props: true },
  ],
});

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');
