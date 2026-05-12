<template>
  <div class="max-w-[1600px] mx-auto p-md lg:p-lg">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-4">
      <div>
        <h1 class="font-headline-xl text-2xl font-bold text-on-surface tracking-tight">System Overview</h1>
        <p class="font-body-sm text-on-primary-container mt-1 opacity-80">Real-time status of monitored Jira instances and team performance.</p>
        <p class="font-body-xs text-on-surface-variant mt-1 max-w-2xl">{{ sprintContextLine }}</p>
      </div>

      <div class="flex gap-xs w-full md:w-auto">
        <button class="flex-1 md:flex-none px-md py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-semibold text-on-surface hover:bg-surface-container transition-all flex items-center justify-center gap-sm shadow-sm">
          <span class="material-symbols-outlined text-[18px]">filter_list</span>
          Filter
        </button>
        <button class="flex-1 md:flex-none px-md py-1.5 bg-secondary text-on-secondary rounded-lg text-body-sm font-bold hover:shadow-lg hover:shadow-secondary/20 transition-all flex items-center justify-center gap-sm">
          <span class="material-symbols-outlined text-[18px]">export_notes</span>
          Export Report
        </button>
      </div>
    </div>

    <!-- Stats Grid Row 1 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-md mb-md">
      <!-- Total Tasks -->
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm flex items-center gap-md">
        <div class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <span class="material-symbols-outlined text-xl fill-0">assignment</span>
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-on-surface leading-none">{{ jiraStore.issues.length }}</span>
            <span class="text-[9px] font-bold text-on-primary-container tracking-wider uppercase">Total Tasks</span>
          </div>
        </div>
      </div>

      <!-- In Flight -->
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm flex items-center gap-md">
        <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <span class="material-symbols-outlined text-xl fill-0">sync</span>
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-on-surface leading-none">{{ inFlightCount }}</span>
            <span class="text-[9px] font-bold text-on-primary-container tracking-wider uppercase">In Flight</span>
          </div>
        </div>
      </div>

      <!-- Blocked -->
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm flex items-center gap-md">
        <div class="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <span class="material-symbols-outlined text-xl fill-0">report</span>
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-on-surface leading-none">{{ blockedCount }}</span>
            <span class="text-[9px] font-bold text-on-primary-container tracking-wider uppercase">Blocked</span>
          </div>
        </div>
      </div>

      <!-- Done -->
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm flex items-center gap-md">
        <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
          <span class="material-symbols-outlined text-xl fill-0">check_circle</span>
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-on-surface leading-none">{{ doneCount }}</span>
            <span class="text-[9px] font-bold text-on-primary-container tracking-wider uppercase">Done</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Story Points Row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm flex items-center gap-md">
        <div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <span class="material-symbols-outlined text-xl fill-0">layers</span>
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-on-surface leading-none">{{ storyPointsDoneDisplay }}</span>
            <span class="text-[9px] font-bold text-on-primary-container tracking-wider uppercase">SP (Done)</span>
          </div>
        </div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm flex items-center gap-md">
        <div class="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
          <span class="material-symbols-outlined text-xl fill-0">database</span>
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-on-surface leading-none">{{ storyPointsTotalDisplay }}</span>
            <span class="text-[9px] font-bold text-on-primary-container tracking-wider uppercase">SP (Total)</span>
          </div>
        </div>
      </div>

      <!-- Add more metrics here in the remaining 2 columns if needed, for now they will be empty grid cells or we can just let them be 2 cols -->
      <div class="hidden lg:block lg:col-span-2"></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-lg">
      <!-- Recent Tasks Widget -->
      <div class="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div class="px-lg py-md flex items-center justify-between border-b border-outline-variant">
          <h2 class="text-lg font-bold text-on-surface">Recent Tasks</h2>
          <router-link class="text-secondary text-xs font-bold hover:underline underline-offset-4" to="/tasks">View All</router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-container-low">
              <tr>
                <th class="px-lg py-2 text-[9px] font-bold text-on-primary-container uppercase tracking-widest">Key</th>
                <th class="px-lg py-2 text-[9px] font-bold text-on-primary-container uppercase tracking-widest">Summary</th>
                <th class="px-lg py-2 text-[9px] font-bold text-on-primary-container uppercase tracking-widest text-center">Status</th>
                <th class="px-lg py-2 text-[9px] font-bold text-on-primary-container uppercase tracking-widest">Assignee</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr v-for="issue in recentIssues" :key="issue.id" 
                  class="group hover:bg-surface-container transition-colors cursor-pointer"
                  @click="$router.push(`/tasks/${issue.key}`)">
                <td class="px-lg py-3 text-sm font-bold text-on-surface group-hover:text-secondary transition-colors">{{ issue.key }}</td>
                <td class="px-lg py-3 text-sm text-on-surface/90 font-medium truncate max-w-xs">{{ issue.summary }}</td>
                <td class="px-lg py-3 text-center">
                  <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block min-w-[70px]" :class="statusChipClass(issue)">
                    {{ issue.status }}
                  </span>
                </td>
                <td class="px-lg py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-bold text-on-surface overflow-hidden">
                      <span v-if="!issue.assignee" class="material-symbols-outlined text-xs opacity-50">person</span>
                      <span v-else>{{ issue.assignee.charAt(0) }}</span>
                    </div>
                    <span class="text-xs font-medium text-on-surface/80">{{ issue.assignee || '—' }}</span>
                  </div>
                </td>
              </tr>
              <tr v-if="jiraStore.loading && jiraStore.issues.length === 0">
                <td colspan="4" class="px-lg py-8 text-center">
                  <div class="flex flex-col items-center gap-2 opacity-40">
                    <span class="material-symbols-outlined animate-spin text-2xl">sync</span>
                    <p class="text-xs font-medium">Synchronizing...</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Notes Widget -->
      <div class="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div class="px-lg py-md flex items-center justify-between border-b border-outline-variant">
          <h2 class="text-lg font-bold text-on-surface">Recent Notes</h2>
          <router-link class="material-symbols-outlined text-on-primary-container hover:text-secondary transition-colors text-[20px]" to="/notes">open_in_new</router-link>
        </div>
        <div class="p-lg space-y-4 flex-1 overflow-y-auto max-h-[400px]">
          <div v-for="(note, index) in recentNotes" :key="note.id" 
               class="group relative flex gap-3 cursor-pointer hover:translate-x-1 transition-all"
               @click="$router.push('/notes')">
            <div class="w-1 rounded-full h-full absolute left-0 top-0 transition-colors"
                 :class="[
                   index % 4 === 0 ? 'bg-emerald-500' : 
                   index % 4 === 1 ? 'bg-blue-500' : 
                   index % 4 === 2 ? 'bg-amber-500' : 'bg-rose-500'
                 ]"></div>
            <div class="pl-4 flex-1">
              <div class="flex justify-between items-start">
                <h3 class="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-1">{{ note.title }}</h3>
                <span class="text-[9px] font-bold text-on-primary-container uppercase shrink-0 ml-2 opacity-60">{{ formatDate(note.updatedAt) }}</span>
              </div>
              <p class="text-[10px] text-on-primary-container font-medium opacity-60 line-clamp-1">Project: {{ note.projectId }}</p>
            </div>
          </div>
          
          <div v-if="notesStore.loading && notesStore.notes.length === 0" class="py-4 text-center opacity-40">
            <span class="material-symbols-outlined animate-spin text-2xl">sync</span>
          </div>
          <div v-if="!notesStore.loading && notesStore.notes.length === 0" class="py-4 text-center opacity-40 italic text-xs">
            No recent notes.
          </div>
        </div>
        
        <div class="p-lg pt-0 mt-auto">
          <button class="w-full py-2.5 border border-dashed border-outline-variant rounded-lg text-[10px] font-bold text-on-primary-container hover:bg-surface-container hover:border-secondary hover:text-secondary transition-all group flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">add_circle</span>
            Add quick note
          </button>
        </div>
      </div>
    </div>
    
    <!-- Analytics Preview -->
    <div class="mt-lg">
      <div class="bg-primary-container text-white rounded-xl p-lg relative overflow-hidden shadow-lg shadow-primary-container/20">
        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 bg-teal-600/50 backdrop-blur-md text-teal-100 px-3 py-1 rounded-full text-[10px] font-bold mb-md">
            <span class="material-symbols-outlined text-[14px]">trending_up</span>
            System Health: Optimal
          </div>
          <div class="flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <div class="text-[9px] opacity-60 uppercase font-bold tracking-widest mb-1">Issues in scope</div>
              <div class="text-xl font-bold">{{ jiraStore.issues.length }}</div>
            </div>
            <div>
              <div class="text-[9px] opacity-60 uppercase font-bold tracking-widest mb-1">Sync Success</div>
              <div class="text-xl font-bold">100%</div>
            </div>
            <div>
              <div class="text-[9px] opacity-60 uppercase font-bold tracking-widest mb-1">Uptime</div>
              <div class="text-xl font-bold">99.98%</div>
            </div>
          </div>
        </div>
        <!-- Decorative Background Element -->
        <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-600 to-transparent opacity-20"></div>
        <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-500 rounded-full blur-3xl opacity-10"></div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button class="fixed bottom-6 right-6 w-14 h-14 bg-secondary text-on-secondary rounded-xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
      <span class="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">add</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useJiraStore } from '../stores/jiraStore';
import { useNotesStore } from '../stores/notesStore';
import { metricBucketForIssue } from '../utils/jiraIssueStatus';
import type { JiraIssueDto } from '../types/api';

const jiraStore = useJiraStore();
const notesStore = useNotesStore();

function statusChipClass(issue: JiraIssueDto) {
  const b = metricBucketForIssue(issue.status);
  if (b === 'done') return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
  if (b === 'inFlight') return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
  if (b === 'blocked') return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
  return 'bg-surface-container-high text-on-surface-variant';
}

const inFlightCount = computed(
  () => jiraStore.issues.filter(i => metricBucketForIssue(i.status) === 'inFlight').length,
);
const doneCount = computed(
  () => jiraStore.issues.filter(i => metricBucketForIssue(i.status) === 'done').length,
);
const blockedCount = computed(
  () => jiraStore.issues.filter(i => metricBucketForIssue(i.status) === 'blocked').length,
);

const hasStoryPointEstimates = computed(() =>
  jiraStore.issues.some(i => i.storyPoints != null && Number(i.storyPoints) > 0),
);

const storyPointsTotal = computed(() =>
  jiraStore.issues.reduce((sum, i) => sum + (i.storyPoints != null ? Number(i.storyPoints) : 0), 0),
);

const storyPointsDone = computed(() =>
  jiraStore.issues
    .filter(i => metricBucketForIssue(i.status) === 'done')
    .reduce((sum, i) => sum + (i.storyPoints != null ? Number(i.storyPoints) : 0), 0),
);

const storyPointsTotalDisplay = computed(() =>
  hasStoryPointEstimates.value ? String(storyPointsTotal.value) : '—',
);
const storyPointsDoneDisplay = computed(() =>
  hasStoryPointEstimates.value ? String(storyPointsDone.value) : '—',
);

const sprintContextLine = computed(() => {
  const board = jiraStore.boardName;
  if (!jiraStore.defaultBoardId) {
    return 'Set a default Jira board in Settings to see sprint metrics.';
  }
  if (jiraStore.sprintScope?.mode === 'active_sprint' && jiraStore.sprintScope.sprint) {
    return `Metrics for active sprint «${jiraStore.sprintScope.sprint.name}» on ${board}.`;
  }
  if (jiraStore.sprintScope?.mode === 'whole_board') {
    return `No active sprint — counts include all issues on ${board}.`;
  }
  return `Board: ${board}.`;
});

const recentIssues = computed(() => jiraStore.issues.slice(0, 10));
const recentNotes = computed(() => notesStore.notes.slice(0, 8));

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
