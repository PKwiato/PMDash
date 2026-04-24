import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import './index.css';
import App from './App.vue';
import MainLayout from './components/layout/MainLayout.vue';
import DashboardView from './views/DashboardView.vue';
import TaskListView from './views/TaskListView.vue';
import TaskDetailView from './views/TaskDetailView.vue';
import NotesOverview from './views/NotesOverview.vue';
import ProjectDetailView from './views/ProjectDetailView.vue';
import ProjectsView from './views/ProjectsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'tasks', name: 'task-list', component: TaskListView },
        { path: 'tasks/:id', name: 'task-detail', component: TaskDetailView },
        { path: 'notes', name: 'notes-overview', component: NotesOverview },
      ]
    },
    // Old routes kept for reference
    { path: '/projects-old', name: 'projects', component: ProjectsView },
    { path: '/projects-old/:id', name: 'project', component: ProjectDetailView, props: true },
  ],
});

createApp(App).use(router).mount('#app');
