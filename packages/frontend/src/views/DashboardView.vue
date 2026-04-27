<template>
  <div class="max-w-7xl mx-auto p-gutter lg:p-xl">
    <!-- Header Section -->
    <div class="flex justify-between items-end mb-xl">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-on-surface">System Overview</h1>
        <p class="font-body-md text-body-md text-on-primary-container mt-xs">Real-time status of monitored Jira instances and team performance.</p>
      </div>

      <div class="flex gap-sm">
        <button class="px-md py-sm bg-white border border-outline-variant rounded-lg text-body-md font-medium text-on-surface hover:bg-slate-50 transition-colors flex items-center gap-sm">
          <span class="material-symbols-outlined text-md">filter_list</span>
          Filter
        </button>
        <button class="px-md py-sm bg-secondary text-white rounded-lg text-body-md font-bold hover:opacity-90 transition-opacity flex items-center gap-sm">
          <span class="material-symbols-outlined text-md">download</span>
          Export Report
        </button>
      </div>
    </div>
    <!-- Bento Grid Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
      <div class="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-md">
          <div class="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <span class="material-symbols-outlined">assignment</span>
          </div>
        </div>
        <div class="text-headline-lg font-headline-lg text-on-surface">{{ jiraStore.issues.length }}</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Total Tasks</div>
      </div>
      <div class="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-md">
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <span class="material-symbols-outlined">sync</span>
          </div>
        </div>
        <div class="text-headline-lg font-headline-lg text-on-surface">{{ inProgressCount }}</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">In Progress</div>
      </div>
      <div class="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-md">
          <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-error">
            <span class="material-symbols-outlined">block</span>
          </div>
        </div>
        <div class="text-headline-lg font-headline-lg text-on-surface">{{ blockedCount }}</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Blocked Issues</div>
      </div>
      <div class="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-md">
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-on-secondary-container">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
        </div>
        <div class="text-headline-lg font-headline-lg text-on-surface">{{ resolvedCount }}</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Resolved</div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
      <!-- Recent Tasks Widget -->
      <div class="lg:col-span-2 bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div class="px-lg py-md border-b border-outline-variant flex items-center justify-between">
          <h2 class="font-headline-md text-headline-md">Recent Tasks</h2>
          <router-link class="text-secondary text-label-md font-label-md hover:underline" to="/tasks">View All</router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 border-b border-outline-variant">
              <tr>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">KEY</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">SUMMARY</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">STATUS</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">ASSIGNEE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="issue in recentIssues" :key="issue.id" 
                  class="hover:bg-slate-50 transition-colors cursor-pointer"
                  @click="$router.push(`/tasks/${issue.key}`)">
                <td class="px-lg py-md font-label-md text-secondary">{{ issue.key }}</td>
                <td class="px-lg py-md font-body-md text-on-surface">{{ issue.summary }}</td>
                <td class="px-lg py-md">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" :class="{
                    'bg-green-100 text-green-800': issue.status === 'Done',
                    'bg-blue-100 text-blue-700': issue.status === 'In Progress',
                    'bg-slate-100 text-slate-600': !['Done', 'In Progress'].includes(issue.status)
                  }">{{ issue.status }}</span>
                </td>
                <td class="px-lg py-md">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] text-white">
                      {{ issue.assignee ? issue.assignee.charAt(0) : '?' }}
                    </div>
                    <span class="text-body-sm">{{ issue.assignee || 'Unassigned' }}</span>
                  </div>
                </td>
              </tr>
              <tr v-if="jiraStore.loading && jiraStore.issues.length === 0">
                <td colspan="4" class="px-lg py-8 text-center text-slate-400">Loading issues...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Recent Notes Widget -->
      <div class="bg-white border border-outline-variant rounded-xl shadow-sm flex flex-col">
        <div class="px-lg py-md border-b border-outline-variant flex items-center justify-between">
          <h2 class="font-headline-md text-headline-md">Recent Notes</h2>
          <router-link class="material-symbols-outlined text-slate-400 hover:text-slate-600" to="/notes">open_in_new</router-link>
        </div>
        <div class="p-lg space-y-lg overflow-y-auto max-h-[400px]">
          <div v-for="note in recentNotes" :key="note.id" 
               class="border-l-4 border-teal-600 pl-md cursor-pointer hover:bg-slate-50 transition-colors p-1 rounded-r"
               @click="$router.push('/notes')">
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-label-md text-on-surface">{{ note.title }}</h3>
              <span class="text-[10px] text-on-primary-container">{{ new Date(note.updatedAt).toLocaleDateString() }}</span>
            </div>
            <p class="text-body-sm text-on-primary-container line-clamp-2">Project: {{ note.projectId }}</p>
          </div>
          <div v-if="notesStore.loading && notesStore.notes.length === 0" class="text-center text-slate-400">Loading notes...</div>
          <div v-if="!notesStore.loading && notesStore.notes.length === 0" class="text-center text-slate-400">No notes found.</div>
        </div>
        <div class="mt-auto p-lg pt-0">
          <button class="w-full py-2 border border-dashed border-outline rounded-lg text-body-sm text-on-primary-container hover:bg-slate-50 transition-colors">
            + Add quick note
          </button>
        </div>
      </div>
    </div>
    <!-- Team Activity / Analytics Preview -->
    <div class="mt-xl grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <div class="md:col-span-3 bg-primary-container text-white rounded-xl p-xl relative overflow-hidden">
        <div class="relative z-10">
          <div class="inline-flex items-center gap-sm bg-teal-600/30 text-teal-400 px-md py-1 rounded-full text-label-sm mb-md">
            <span class="material-symbols-outlined text-sm">trending_up</span>
            System Health: Optimal
          </div>
          <h2 class="font-headline-xl text-headline-xl mb-md">All systems operational</h2>
          <div class="flex gap-xl">
            <div>
              <div class="text-label-sm opacity-60 uppercase mb-1">Active Issues</div>
              <div class="text-headline-md">{{ jiraStore.issues.length }}</div>
            </div>
            <div>
              <div class="text-label-sm opacity-60 uppercase mb-1">Sync Success</div>
              <div class="text-headline-md">100%</div>
            </div>
            <div>
              <div class="text-label-sm opacity-60 uppercase mb-1">Uptime</div>
              <div class="text-headline-md">99.98%</div>
            </div>
          </div>
        </div>
        <!-- Decorative Background Element -->
        <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-600/20 to-transparent"></div>
        <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>

    <!-- Contextual FAB (Only on dashboard/home) -->
    <button class="fixed bottom-xl right-xl w-14 h-14 bg-secondary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-50">
      <span class="material-symbols-outlined text-3xl">add</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useJiraStore } from '../stores/jiraStore';
import { useNotesStore } from '../stores/notesStore';

const jiraStore = useJiraStore();
const notesStore = useNotesStore();

const inProgressCount = computed(() => jiraStore.issues.filter(i => i.status === 'In Progress').length);
const resolvedCount = computed(() => jiraStore.issues.filter(i => i.status === 'Done' || i.status === 'Resolved').length);
const blockedCount = computed(() => jiraStore.issues.filter(i => i.status.toLowerCase().includes('block')).length);

const recentIssues = computed(() => jiraStore.issues.slice(0, 5));
const recentNotes = computed(() => notesStore.notes.slice(0, 4));

onMounted(async () => {
  await jiraStore.fetchConfig();
  jiraStore.fetchIssuesForBoard();
  notesStore.fetchAllNotes();
});
</script>
