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
import NoteTasksOverview from './views/NoteTasksOverview.vue';
import ProjectDetailView from './views/ProjectDetailView.vue';
import ProjectsView from './views/ProjectsView.vue';
import SettingsView from './views/SettingsView.vue';
import TagsView from './views/TagsView.vue';
import ClockworkAnalysisView from './views/ClockworkAnalysisView.vue';
import ProgramsView from './views/ProgramsView.vue';
import BiweeklySummaryView from './views/BiweeklySummaryView.vue';
import PrStatisticsView from './views/PrStatisticsView.vue';

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
        { path: 'programs', name: 'programs', component: ProgramsView },
        { path: 'team-summary', name: 'team-summary', component: BiweeklySummaryView },
        { path: 'tasks/:id', name: 'task-detail', component: TaskDetailView, alias: '/task/:id' },
        { path: 'notes', name: 'notes-overview', component: NotesOverview },
        { path: 'notes/tasks', name: 'note-tasks', component: NoteTasksOverview },
        { path: 'tags', name: 'tags', component: TagsView },
        { path: 'clockwork/analysis', name: 'clockwork-analysis', component: ClockworkAnalysisView },
        { path: 'pr-statistics', name: 'pr-statistics', component: PrStatisticsView },
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
