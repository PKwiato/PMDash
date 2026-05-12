<template>
  <div class="max-w-7xl mx-auto p-gutter lg:p-xl">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-xl gap-4">
      <div>
        <h1 class="font-headline-xl text-3xl font-bold text-on-surface tracking-tight">System Overview</h1>
        <p class="font-body-md text-on-primary-container mt-1 opacity-80">Real-time status of monitored Jira instances and team performance.</p>
      </div>

      <div class="flex gap-sm w-full md:w-auto">
        <button class="flex-1 md:flex-none px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md font-semibold text-on-surface hover:bg-surface-container transition-all flex items-center justify-center gap-sm shadow-sm">
          <span class="material-symbols-outlined text-[20px]">filter_list</span>
          Filter
        </button>
        <button class="flex-1 md:flex-none px-lg py-sm bg-secondary text-on-secondary rounded-xl text-body-md font-bold hover:shadow-lg hover:shadow-secondary/20 transition-all flex items-center justify-center gap-sm">
          <span class="material-symbols-outlined text-[20px]">export_notes</span>
          Export Report
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
      <!-- Total Tasks -->
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl shadow-sm flex items-center gap-lg">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <span class="material-symbols-outlined text-2xl fill-0">assignment</span>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-on-surface leading-none">{{ jiraStore.issues.length }}</span>
            <span class="text-[10px] font-bold text-on-primary-container tracking-wider uppercase">Total Tasks</span>
          </div>
        </div>
      </div>

      <!-- In Flight -->
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl shadow-sm flex items-center gap-lg">
        <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <span class="material-symbols-outlined text-2xl fill-0">sync</span>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-on-surface leading-none">{{ inFlightCount }}</span>
            <span class="text-[10px] font-bold text-on-primary-container tracking-wider uppercase">In Flight</span>
          </div>
        </div>
      </div>

      <!-- Blocked -->
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl shadow-sm flex items-center gap-lg">
        <div class="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <span class="material-symbols-outlined text-2xl fill-0">report</span>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-on-surface leading-none">{{ blockedCount }}</span>
            <span class="text-[10px] font-bold text-on-primary-container tracking-wider uppercase">Blocked Issues</span>
          </div>
        </div>
      </div>

      <!-- Done -->
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl shadow-sm flex items-center gap-lg">
        <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
          <span class="material-symbols-outlined text-2xl fill-0">check_circle</span>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-on-surface leading-none">{{ doneCount }}</span>
            <span class="text-[10px] font-bold text-on-primary-container tracking-wider uppercase">Done</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Story Points Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-xl">
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl shadow-sm flex items-center gap-lg">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <span class="material-symbols-outlined text-2xl fill-0">layers</span>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-on-surface leading-none">{{ storyPointsDone }}</span>
            <span class="text-[10px] font-bold text-on-primary-container tracking-wider uppercase">Story Points (Done)</span>
          </div>
        </div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl shadow-sm flex items-center gap-lg">
        <div class="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
          <span class="material-symbols-outlined text-2xl fill-0">database</span>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-on-surface leading-none">{{ storyPointsTotal }}</span>
            <span class="text-[10px] font-bold text-on-primary-container tracking-wider uppercase">Story Points (Total)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-xl">
      <!-- Recent Tasks Widget -->
      <div class="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div class="px-xl py-lg flex items-center justify-between border-b border-outline-variant">
          <h2 class="text-xl font-bold text-on-surface">Recent Tasks</h2>
          <router-link class="text-secondary text-sm font-bold hover:underline underline-offset-4" to="/tasks">View All</router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-container-low">
              <tr>
                <th class="px-xl py-md text-[10px] font-bold text-on-primary-container uppercase tracking-widest">Key</th>
                <th class="px-xl py-md text-[10px] font-bold text-on-primary-container uppercase tracking-widest">Summary</th>
                <th class="px-xl py-md text-[10px] font-bold text-on-primary-container uppercase tracking-widest text-center">Status</th>
                <th class="px-xl py-md text-[10px] font-bold text-on-primary-container uppercase tracking-widest">Assignee</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr v-for="issue in recentIssues" :key="issue.id" 
                  class="group hover:bg-surface-container transition-colors cursor-pointer"
                  @click="$router.push(`/tasks/${issue.key}`)">
                <td class="px-xl py-lg text-sm font-bold text-on-surface group-hover:text-secondary transition-colors">{{ issue.key }}</td>
                <td class="px-xl py-lg text-sm text-on-surface/90 font-medium">{{ issue.summary }}</td>
                <td class="px-xl py-lg text-center">
                  <span class="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-block min-w-[80px]" :class="statusClass(issue.status)">
                    {{ issue.status }}
                  </span>
                </td>
                <td class="px-xl py-lg">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-xs font-bold text-on-surface overflow-hidden">
                      <span v-if="!issue.assignee" class="material-symbols-outlined text-sm opacity-50">person</span>
                      <span v-else>{{ issue.assignee.charAt(0) }}</span>
                    </div>
                    <span class="text-sm font-medium text-on-surface/80">{{ issue.assignee || 'Unassigned' }}</span>
                  </div>
                </td>
              </tr>
              <tr v-if="jiraStore.loading && jiraStore.issues.length === 0">
                <td colspan="4" class="px-xl py-12 text-center">
                  <div class="flex flex-col items-center gap-3 opacity-40">
                    <span class="material-symbols-outlined animate-spin text-4xl">sync</span>
                    <p class="text-sm font-medium">Synchronizing with Jira...</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Notes Widget -->
      <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div class="px-xl py-lg flex items-center justify-between border-b border-outline-variant">
          <h2 class="text-xl font-bold text-on-surface">Recent Notes</h2>
          <router-link class="material-symbols-outlined text-on-primary-container hover:text-secondary transition-colors" to="/notes">open_in_new</router-link>
        </div>
        <div class="p-xl space-y-6 flex-1 overflow-y-auto">
          <div v-for="(note, index) in recentNotes" :key="note.id" 
               class="group relative flex gap-4 cursor-pointer hover:translate-x-1 transition-all"
               @click="$router.push('/notes')">
            <div class="w-1 rounded-full h-full absolute left-0 top-0 transition-colors"
                 :class="[
                   index % 4 === 0 ? 'bg-emerald-500' : 
                   index % 4 === 1 ? 'bg-blue-500' : 
                   index % 4 === 2 ? 'bg-amber-500' : 'bg-rose-500'
                 ]"></div>
            <div class="pl-4 flex-1">
              <div class="flex justify-between items-start mb-1">
                <h3 class="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-1">{{ note.title }}</h3>
                <span class="text-[10px] font-bold text-on-primary-container uppercase shrink-0 ml-2">{{ formatDate(note.updatedAt) }}</span>
              </div>
              <p class="text-[11px] text-on-primary-container font-medium opacity-70 line-clamp-1">Project: {{ note.projectId }}</p>
            </div>
          </div>
          
          <div v-if="notesStore.loading && notesStore.notes.length === 0" class="py-8 text-center opacity-40">
            <span class="material-symbols-outlined animate-spin text-3xl">sync</span>
          </div>
          <div v-if="!notesStore.loading && notesStore.notes.length === 0" class="py-8 text-center opacity-40 italic text-sm">
            No recent notes found.
          </div>
        </div>
        
        <div class="p-xl pt-0 mt-auto">
          <button class="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-xs font-bold text-on-primary-container hover:bg-surface-container hover:border-secondary hover:text-secondary transition-all group flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">add_circle</span>
            Add quick note
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button class="fixed bottom-8 right-8 w-16 h-16 bg-secondary text-on-secondary rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
      <span class="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useJiraStore } from '../stores/jiraStore';
import { useNotesStore } from '../stores/notesStore';

const jiraStore = useJiraStore();
const notesStore = useNotesStore();

// Stats calculations
const inFlightCount = computed(() => 
  jiraStore.issues.filter(i => ['In Progress', 'In Flight', 'Testowanie', 'Beta'].includes(i.status)).length
);

const doneCount = computed(() => 
  jiraStore.issues.filter(i => ['Done', 'Resolved', 'Zakończone'].includes(i.status)).length
);

const blockedCount = computed(() => 
  jiraStore.issues.filter(i => i.status.toLowerCase().includes('block') || i.status === 'Blocked').length
);

const storyPointsDone = computed(() => 
  jiraStore.issues
    .filter(i => ['Done', 'Resolved', 'Zakończone'].includes(i.status))
    .reduce((sum, i) => sum + (i.storyPoints || 0), 0)
);

const storyPointsTotal = computed(() => 
  jiraStore.issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)
);

const recentIssues = computed(() => jiraStore.issues.slice(0, 5));
const recentNotes = computed(() => notesStore.notes.slice(0, 4));

// Helpers
const statusClass = (status: string) => {
  const s = status.toLowerCase();
  if (['done', 'resolved', 'zakończone'].includes(s)) return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
  if (['in progress', 'in flight', 'testowanie', 'beta'].includes(s)) return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
  if (s.includes('block')) return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
  return 'bg-surface-container-high text-on-surface-variant';
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
};

onMounted(async () => {
  await jiraStore.fetchConfig();
  jiraStore.fetchIssuesForBoard();
  notesStore.fetchAllNotes();
});
</script>

<style scoped>
/* Custom scrollbar for better look */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-surface-variant rounded-full;
}
</style>
