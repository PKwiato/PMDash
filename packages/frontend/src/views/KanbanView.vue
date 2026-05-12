<template>
  <div class="h-[calc(100vh-64px)] flex flex-col bg-background transition-colors duration-300">
    <!-- Header Section (Subtle) -->
    <header class="px-lg py-4 flex items-center justify-between border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-20">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-bold text-on-surface">Kanban Board</h1>
        <div class="flex items-center gap-2 px-2 py-0.5 bg-secondary/10 border border-secondary/20 rounded text-[10px] font-black text-secondary uppercase tracking-wider">
          <div class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
          Live Sync
        </div>
      </div>
      <button @click="refresh" :disabled="jiraStore.loading" class="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant rounded border border-outline-variant transition-colors text-xs font-bold">
        <span class="material-symbols-outlined text-[16px]" :class="{ 'animate-spin': jiraStore.loading }">refresh</span>
        Refresh
      </button>
    </header>

    <!-- Board Container -->
    <div v-if="jiraStore.loading && !jiraStore.issues.length" class="flex-1 flex items-center justify-center">
      <span class="material-symbols-outlined animate-spin text-4xl text-outline">sync</span>
    </div>

    <div v-else class="flex-1 overflow-x-auto scrollbar-jira">
      <div class="inline-flex gap-3 p-4 min-w-full justify-center items-start">
        <div v-for="status in displayColumns" :key="status" 
             class="flex-shrink-0 w-[280px] flex flex-col max-h-full bg-transparent">
          
          <!-- Column Header -->
          <div class="px-2 py-3 flex items-center gap-2 mb-2">
            <h2 class="font-black text-on-surface-variant/60 text-[11px] uppercase tracking-widest">{{ status }}</h2>
            <span class="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant">
              {{ groupedIssues[status]?.length || 0 }}
            </span>
          </div>
          
          <!-- Cards List -->
          <div class="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-jira-v max-h-[calc(100vh-180px)]">
            <div v-for="issue in groupedIssues[status]" :key="issue.id" 
              class="bg-surface-container-lowest border border-outline-variant p-3 shadow-sm hover:shadow-md hover:border-secondary/50 transition-all cursor-pointer rounded-xl group"
              @click="router.push(`/tasks/${issue.key}`)">
              
              <!-- Summary (Main focus) -->
              <h3 class="text-[13px] font-bold text-on-surface mb-1 leading-snug group-hover:text-secondary transition-colors">
                {{ issue.summary }}
              </h3>

              <!-- Metadata Row 1: Assignee Name (Subtle) -->
              <p class="text-[11px] text-on-surface-variant/70 mb-3 font-medium">{{ issue.assignee || 'Unassigned' }}</p>

              <!-- Metadata Row 2: Labels / Version -->
              <div class="flex flex-wrap gap-1.5 mb-3">
                <!-- Label -->
                <span class="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider rounded dark:bg-primary/20">
                  {{ issue.issueType }}
                </span>
                <!-- Version / Markers -->
                <span class="px-1.5 py-0.5 border border-outline-variant text-on-surface-variant text-[9px] font-bold uppercase rounded" v-if="issue.key.startsWith('DESKTOP')">
                  DESKTOP/2.29.0
                </span>
                <span class="px-1.5 py-0.5 bg-error/10 text-error text-[9px] font-black uppercase rounded dark:bg-error/20" v-if="issue.priority === 'Highest'">
                  HOTFIX
                </span>
              </div>

              <!-- Metadata Row 3: Points & Status Indicators -->
              <div class="flex items-center gap-2 mb-4">
                <!-- Story Points -->
                <div class="px-2 py-0.5 bg-surface-container text-[10px] font-bold text-on-surface border border-outline-variant rounded">SP:
                  {{ issue.storyPoints || '0' }}
                </div>
                
                <!-- Time in Status -->
                <div v-if="issue.currentStatusBusinessDays !== undefined" 
                     class="flex items-center gap-1 px-2 py-0.5 bg-surface-container text-[10px] font-bold text-on-surface border border-outline-variant rounded"
                     title="Business days in current status">
                  <span class="material-symbols-outlined text-[14px] text-outline">schedule</span>
                  {{ formatDwell(issue.currentStatusBusinessDays) }}d
                </div>

                <!-- Priority Icon -->
                <span class="material-symbols-outlined text-[18px] ml-auto" :class="priorityColor(issue.priority)">
                  {{ priorityIcon(issue.priority) }}
                </span>
              </div>
              
              <!-- Footer: Key & Avatar -->
              <div class="flex items-center justify-between mt-auto">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px] text-primary">check_box</span>
                  <span class="text-[11px] font-bold text-on-surface-variant/60 tracking-tight">{{ issue.key }}</span>
                </div>
                
                <div v-if="issue.assignee" class="relative">
                  <div class="w-6 h-6 rounded-full overflow-hidden border border-outline-variant bg-secondary text-on-secondary flex items-center justify-center text-[10px] font-bold">
                    <img v-if="issue.assigneeAvatarUrl" :src="issue.assigneeAvatarUrl" :alt="issue.assignee" class="w-full h-full object-cover" />
                    <template v-else>{{ issue.assignee.charAt(0) }}</template>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Column Empty state -->
            <div v-if="!groupedIssues[status]?.length" class="h-20 border border-dashed border-outline-variant/30 rounded flex items-center justify-center">
              <span class="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest">Empty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '../stores/jiraStore';
import { KANBAN_COLUMNS, groupIssuesByKanbanColumn, type KanbanColumn } from '../utils/jiraIssueStatus';

const router = useRouter();
const jiraStore = useJiraStore();

const displayColumns: KanbanColumn[] = [...KANBAN_COLUMNS];

const groupedIssues = computed(() => groupIssuesByKanbanColumn(jiraStore.issues));

function priorityIcon(priority: string) {
  if (priority === 'High' || priority === 'Highest') return 'keyboard_double_arrow_up';
  if (priority === 'Medium') return 'keyboard_arrow_up';
  return 'keyboard_arrow_down';
}

function priorityColor(priority: string) {
  if (priority === 'High' || priority === 'Highest') return 'text-error';
  if (priority === 'Medium') return 'text-amber-500';
  return 'text-emerald-500';
}

function formatDwell(days: number | undefined) {
  if (days === undefined || !Number.isFinite(days)) return '—';
  return days >= 10 ? days.toFixed(1) : days.toFixed(2);
}

async function refresh() {
  await jiraStore.fetchConfig();
  await jiraStore.fetchIssuesForBoard(undefined, true, true);
}

onMounted(async () => {
  await refresh();
});
</script>

<style scoped>
.scrollbar-jira::-webkit-scrollbar {
  height: 8px;
}
.scrollbar-jira::-webkit-scrollbar-track {
  @apply bg-background;
}
.scrollbar-jira::-webkit-scrollbar-thumb {
  @apply bg-outline-variant rounded-full;
}

.scrollbar-jira-v::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-jira-v::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-jira-v::-webkit-scrollbar-thumb {
  @apply bg-outline-variant rounded-full;
}

/* Transitions */
.animate-card-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
