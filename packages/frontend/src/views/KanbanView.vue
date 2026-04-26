<template>
  <div class="p-lg max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg flex-shrink-0">
      <div>
        <nav class="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">
          <span>Projects</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span>JiraMonitor</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span class="text-on-surface">Kanban</span>
        </nav>
        <h1 class="font-headline-xl text-on-surface">Kanban Board</h1>
      </div>
      <div class="flex items-center gap-sm">
        <button @click="refresh" class="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg font-label-md hover:bg-secondary/90 transition-colors shadow-sm">
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>
    </header>

    <div v-if="jiraStore.loading" class="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
      <div class="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="font-headline-md">Loading tasks...</p>
    </div>

    <div v-else-if="jiraStore.error" class="flex-1 flex flex-col items-center justify-center text-error">
      <span class="material-symbols-outlined text-[48px]">error</span>
      <p class="mt-4 font-headline-md">{{ jiraStore.error }}</p>
      <button @click="refresh" class="mt-4 px-6 py-2 bg-surface-container-high rounded-full font-label-md">Try Again</button>
    </div>

    <div v-else class="flex-1 flex gap-gutter overflow-x-auto pb-lg min-h-0 items-start">
      <div v-for="status in displayColumns" :key="status" class="flex-shrink-0 w-80 flex flex-col max-h-full bg-surface-container-low rounded-xl border border-outline-variant shadow-sm">
        <div class="p-md bg-surface-container-high/50 border-b border-outline-variant flex items-center justify-between backdrop-blur-sm sticky top-0 z-10">
          <div class="flex items-center gap-3">
            <div class="w-2 h-6 rounded-full" :class="{
              'bg-slate-300': status === 'Do zrobienia',
              'bg-blue-400': status === 'W toku',
              'bg-amber-400': status === 'Code Review',
              'bg-purple-400': status === 'Testowanie',
              'bg-orange-400': status === 'Beta',
              'bg-green-500': status === 'Gotowe'
            }"></div>
            <h2 class="font-headline-md text-on-surface text-sm">{{ status }}</h2>
            <span class="px-2 py-0.5 bg-surface-container-highest rounded-full text-[10px] font-bold text-on-surface-variant">
              {{ groupedIssues[status]?.length || 0 }}
            </span>
          </div>
          <button class="material-symbols-outlined text-outline hover:text-on-surface transition-colors text-lg">more_horiz</button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-md space-y-md min-h-[100px]">
          <div v-for="issue in groupedIssues[status]" :key="issue.id" 
            class="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm hover:shadow-md hover:border-secondary transition-all cursor-pointer group animate-fade-in"
            @click="router.push(`/tasks/${issue.key}`)">
            
            <div class="flex items-start justify-between mb-2">
              <span class="text-[10px] font-bold tracking-wider uppercase text-secondary bg-secondary-container/20 px-1.5 py-0.5 rounded leading-none">{{ issue.key }}</span>
              <div class="flex items-center gap-1">
                 <span v-if="issue.priority === 'High' || issue.priority === 'Highest'" class="material-symbols-outlined text-[16px] text-error">keyboard_double_arrow_up</span>
                 <span v-else-if="issue.priority === 'Medium'" class="material-symbols-outlined text-[16px] text-tertiary-container">keyboard_arrow_up</span>
                 <span v-else class="material-symbols-outlined text-[16px] text-outline">keyboard_arrow_down</span>
              </div>
            </div>
            
            <h3 class="font-body-md font-semibold text-on-surface line-clamp-3 mb-3 leading-snug group-hover:text-secondary transition-colors">{{ issue.summary }}</h3>
            
            <div class="flex items-center justify-between mt-auto pt-2 border-t border-outline-variant/30">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[14px] text-on-surface-variant">description</span>
                <span class="text-[11px] font-medium text-on-surface-variant uppercase">{{ issue.issueType }}</span>
              </div>
              <div v-if="issue.assignee" class="flex items-center -space-x-1">
                <div class="w-6 h-6 rounded-full bg-primary-container border-2 border-surface-container-lowest flex items-center justify-center text-[10px] text-white font-bold shadow-sm" :title="issue.assignee">
                  {{ issue.assignee.charAt(0) }}
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="!groupedIssues[status]?.length" class="h-32 border-2 border-dashed border-outline-variant/50 rounded-lg flex flex-col items-center justify-center text-on-surface-variant/30 space-y-2">
            <span class="material-symbols-outlined text-2xl">inbox</span>
            <span class="text-[11px] font-medium uppercase tracking-widest">No tasks</span>
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

const router = useRouter();
const jiraStore = useJiraStore();

const defaultColumns = ['Do zrobienia', 'W toku', 'Code Review', 'Testowanie', 'Beta', 'Gotowe'];

const statusMapping: Record<string, string> = {
  // Do zrobienia
  'to do': 'Do zrobienia',
  'open': 'Do zrobienia',
  'backlog': 'Do zrobienia',
  'selected for development': 'Do zrobienia',
  'do zrobienia': 'Do zrobienia',
  'otwarte': 'Do zrobienia',
  // W toku
  'in progress': 'W toku',
  'development': 'W toku',
  'running': 'W toku',
  'in dev': 'W toku',
  'w toku': 'W toku',
  'w pracy': 'W toku',
  // Code Review
  'code review': 'Code Review',
  'review': 'Code Review',
  'peer review': 'Code Review',
  'in review': 'Code Review',
  'do przeglądu': 'Code Review',
  // Testowanie
  'testing': 'Testowanie',
  'qa': 'Testowanie',
  'test': 'Testowanie',
  'ready for qa': 'Testowanie',
  'qa ready': 'Testowanie',
  'ready for test': 'Testowanie',
  'ready for testing': 'Testowanie',
  'to test': 'Testowanie',
  'testowanie': 'Testowanie',
  // Beta
  'beta': 'Beta',
  'staging': 'Beta',
  // Gotowe
  'done': 'Gotowe',
  'closed': 'Gotowe',
  'resolved': 'Gotowe',
  'finished': 'Gotowe',
  'gotowe': 'Gotowe',
  'zrobione': 'Gotowe',
  'ukończone': 'Gotowe',
  'zamknięte': 'Gotowe'
};

const groupedIssues = computed(() => {
  const groups: Record<string, any[]> = {};
  
  // Initialize with default columns
  defaultColumns.forEach(c => groups[c] = []);
  
  jiraStore.issues.forEach(issue => {
    const rawStatus = issue.status || 'To Do';
    const normalizedStatus = rawStatus.toLowerCase().trim();
    
    const mappedStatus = statusMapping[normalizedStatus] || 
                        (normalizedStatus.includes('done') || normalizedStatus.includes('zrobione') ? 'Gotowe' : 'Do zrobienia');
    
    if (groups[mappedStatus]) {
      groups[mappedStatus].push(issue);
    } else {
      groups['Do zrobienia'].push(issue);
    }
  });
  
  return groups;
});

const displayColumns = computed(() => defaultColumns);

async function refresh() {
  await jiraStore.fetchConfig();
  jiraStore.fetchIssuesForBoard();
}

onMounted(async () => {
  if (jiraStore.issues.length === 0) {
    await refresh();
  }
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom scrollbar for columns */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-outline-variant/30 rounded-full;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-outline-variant/60;
}
</style>
