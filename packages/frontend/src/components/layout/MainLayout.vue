<template>
  <div class="bg-background text-on-surface min-h-screen font-sans">
    <!-- TopAppBar -->
    <header class="fixed top-0 w-full z-50 border-b border-outline-variant bg-surface shadow-sm flex justify-between items-center h-14 px-4 font-sans text-sm antialiased">
      <div class="flex items-center gap-8">
        <span class="text-lg font-bold tracking-tight text-on-surface">JiraMonitor</span>
        <div class="hidden md:flex items-center gap-6">
          <router-link to="/notes" class="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 h-14 flex items-center px-2" active-class="text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600">Private Notes</router-link>
        </div>
      </div>

      <!-- Center: Board Info -->
      <div class="hidden lg:flex items-center gap-4 bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant">
        <div class="flex items-center gap-2 border-r border-outline-variant pr-4">
          <span class="material-symbols-outlined text-[18px] text-secondary">dashboard</span>
          <span class="font-bold text-on-surface whitespace-nowrap">{{ jiraStore.boardName }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" :class="jiraStore.activeMode === 'production' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'"></div>
          <span class="text-[11px] font-bold uppercase tracking-wider" :class="jiraStore.activeMode === 'production' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
            {{ jiraStore.activeMode }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div class="relative group">
          <span class="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
          <input type="text" placeholder="Search tasks..." class="bg-surface-container border-none rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-secondary transition-all w-64 text-on-surface" />
        </div>
        <button 
          @click="themeStore.toggleTheme"
          class="material-symbols-outlined text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
          :title="themeStore.theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
        >
          {{ themeStore.theme === 'light' ? 'dark_mode' : 'light_mode' }}
        </button>
        <button class="material-symbols-outlined text-slate-500 hover:bg-slate-50 p-2 rounded-full transition-colors">notifications</button>
        <button class="material-symbols-outlined text-slate-500 hover:bg-slate-50 p-2 rounded-full transition-colors">help</button>
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUo91502LN6AfQcT9b5oRcDzTc5p_KeN9C0vnYK_7YsyrhKba_DkSmhavqyrFEopIpdW2ImXdsshnW77siZqtLNDJtcwdIEQMl3VD2JAWcR_sItsroujYmeaJ6b_sIewl8tVl9IXhZ7ATmfOPXs4UT0y35Rmt04EhpwZNLECKNWbXFuuHJ5LDP9yTvgtsRX67wjCSV4_r6epFbiIdNGbqpfMrvy468XuiOxNxe5PLhhjILYcvrOiX5naHXOVOdv9kbhM6DhGkrJug" alt="User profile avatar" class="w-8 h-8 rounded-full border border-slate-200" />
      </div>
    </header>

    <!-- SideNavBar -->
    <aside class="fixed left-0 top-0 h-full w-60 border-r border-outline-variant bg-surface-container-lowest flex flex-col py-6 gap-2 pt-20 z-40 hidden md:flex font-sans text-sm font-medium">
      <div class="px-6 mb-8">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-secondary text-on-secondary rounded flex items-center justify-center font-black">P</div>
          <div>
            <div class="text-on-surface font-bold">Project Workspace</div>
            <div class="text-on-surface-variant text-[10px] uppercase tracking-wider">Jira Integration</div>
          </div>
        </div>
      </div>
      <nav class="flex-1 space-y-1 px-3">
        <router-link to="/" class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg" active-class="text-secondary bg-secondary-container/20 border-r-4 border-secondary" exact-active-class="text-secondary bg-secondary-container/20 border-r-4 border-secondary">
          <span class="material-symbols-outlined">dashboard</span>
          Dashboard
        </router-link>
        <router-link to="/tasks" class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg" active-class="text-secondary bg-secondary-container/20 border-r-4 border-secondary">
          <span class="material-symbols-outlined">format_list_bulleted</span>
          Task List
        </router-link>
        <router-link to="/kanban" class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg" active-class="text-secondary bg-secondary-container/20 border-r-4 border-secondary">
          <span class="material-symbols-outlined">view_kanban</span>
          Kanban
        </router-link>
        <router-link to="/notes" class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg" active-class="text-secondary bg-secondary-container/20 border-r-4 border-secondary">
          <span class="material-symbols-outlined">edit_note</span>
          Private Notes
        </router-link>
        <router-link to="/notes/tasks" class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg" active-class="text-secondary bg-secondary-container/20 border-r-4 border-secondary">
          <span class="material-symbols-outlined">checklist</span>
          Note Tasks
        </router-link>
      </nav>
      <div class="px-3 mt-4">
        <button class="w-full bg-secondary text-on-secondary py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 hover:bg-secondary-fixed transition-all shadow-sm">
          <span class="material-symbols-outlined text-sm">add</span>
          New Task
        </button>
      </div>
      <div class="mt-auto space-y-1 px-3 border-t border-slate-200 pt-4">
        <router-link to="/settings" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all rounded-lg" active-class="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-r-4 border-teal-600">
          <span class="material-symbols-outlined">settings</span>
          Settings
        </router-link>
        <a href="#" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all rounded-lg">
          <span class="material-symbols-outlined">logout</span>
          Logout
        </a>
      </div>
    </aside>

    <!-- Main Content Canvas -->
    <main class="md:pl-60 pt-14 min-h-screen">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useJiraStore } from '../../stores/jiraStore';
import { useThemeStore } from '../../stores/themeStore';

const jiraStore = useJiraStore();
const themeStore = useThemeStore();

onMounted(async () => {
  if (!jiraStore.defaultBoardId) {
    await jiraStore.fetchConfig();
  }
});
</script>
