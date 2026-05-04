<template>
  <div class="max-w-7xl mx-auto p-gutter lg:p-xl">
    <!-- Header Section -->
    <div class="flex flex-wrap justify-between items-end gap-4 mb-xl">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-on-surface">Worklog Analysis</h1>
        <p class="font-body-md text-body-md text-on-primary-container mt-xs">
          Detecting reporting inconsistencies
        </p>
      </div>

      <div class="flex flex-wrap gap-sm items-end">
        <div class="flex flex-col">
          <label class="text-[10px] font-bold uppercase text-on-primary-container mb-1">Board</label>
          <select v-model="selectedBoardId" class="bg-surface-container border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-secondary transition-all text-on-surface min-w-[150px]">
            <option :value="null" disabled>Select Board</option>
            <option v-for="board in jiraStore.boards" :key="board.id" :value="board.id">
              {{ board.name }}
            </option>
          </select>
        </div>

        <div class="flex flex-col">
          <label class="text-[10px] font-bold uppercase text-on-primary-container mb-1">Date Range</label>
          <div class="flex gap-2">
            <input type="date" v-model="dateFrom" class="bg-surface-container border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-secondary transition-all text-on-surface" />
            <input type="date" v-model="dateTo" class="bg-surface-container border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-secondary transition-all text-on-surface" />
          </div>
        </div>
        
        <button 
          @click="refreshAnalysis"
          class="px-md py-sm h-[38px] bg-secondary text-on-secondary rounded-lg text-body-md font-bold hover:bg-secondary-fixed transition-colors flex items-center gap-sm disabled:opacity-50"
          :disabled="clockworkStore.loading || !selectedBoardId"
        >
          <span class="material-symbols-outlined text-md" :class="{ 'animate-spin': clockworkStore.loading }">sync</span>
          Analyze
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div v-if="clockworkStore.analysis.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="text-headline-lg font-headline-lg text-on-surface">{{ totalUsers }}</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Users Analyzed</div>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="text-headline-lg font-headline-lg text-error">{{ totalInconsistencies }}</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Inconsistencies Found</div>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="text-headline-lg font-headline-lg text-on-surface">{{ totalHours.toFixed(1) }}h</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Total Hours Reported</div>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="text-headline-lg font-headline-lg text-on-surface">{{ avgHoursPerUser.toFixed(1) }}h</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Avg Hours per User</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div v-if="clockworkStore.loading" class="p-xl text-center">
        <div class="flex flex-col items-center gap-4">
          <span class="material-symbols-outlined text-4xl animate-spin text-secondary">sync</span>
          <p class="text-on-surface-variant font-body-md">Analyzing worklogs for team members...</p>
        </div>
      </div>

      <div v-else-if="clockworkStore.error" class="p-xl text-center">
        <div class="bg-error-container/20 border border-error/20 p-lg rounded-xl inline-block max-w-md">
          <span class="material-symbols-outlined text-error text-3xl mb-2">error</span>
          <p class="text-on-error-container font-bold mb-1">Analysis Error</p>
          <p class="text-on-error-container text-sm">{{ clockworkStore.error }}</p>
          <button @click="refreshAnalysis" class="mt-4 px-4 py-2 bg-error text-white rounded-lg text-xs font-bold">Retry</button>
        </div>
      </div>

      <div v-else-if="clockworkStore.analysis.length === 0" class="p-xl text-center text-on-surface-variant">
        No analysis data available. Click "Analyze" to start.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">USER</th>
              <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">HOURS</th>
              <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">ISSUES</th>
              <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">BREAKDOWN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant text-on-surface">
            <template v-for="item in clockworkStore.analysis" :key="item.user.accountId">
              <tr class="hover:bg-surface-container/50 transition-colors">
                <td class="px-lg py-md">
                  <div class="flex items-center gap-3">
                    <img v-if="item.user.avatarUrl" :src="item.user.avatarUrl" class="w-8 h-8 rounded-full border border-outline" />
                    <div v-else class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white text-xs">
                      {{ item.user.displayName.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-bold text-body-md">{{ item.user.displayName }}</div>
                      <div class="text-xs text-on-primary-container opacity-60">{{ item.user.accountId.substring(0, 8) }}...</div>
                    </div>
                  </div>
                </td>
                <td class="px-lg py-md font-body-md">
                  {{ (item.totalSeconds / 3600).toFixed(1) }}h
                </td>
                <td class="px-lg py-md">
                  <div class="flex gap-2">
                    <span v-if="item.inconsistencies.length === 0" class="text-green-500 flex items-center gap-1 text-xs">
                      <span class="material-symbols-outlined text-sm">check_circle</span> Clean
                    </span>
                    <span v-else class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-error-container text-on-error-container">
                      {{ item.inconsistencies.length }} Issues
                    </span>
                  </div>
                </td>
                <td class="px-lg py-md">
                   <button 
                    @click="toggleExpand(item.user.accountId)"
                    class="text-secondary text-label-md hover:underline flex items-center gap-1"
                  >
                    {{ expandedUsers.has(item.user.accountId) ? 'Hide' : 'View Details' }}
                    <span class="material-symbols-outlined text-sm">
                      {{ expandedUsers.has(item.user.accountId) ? 'expand_less' : 'expand_more' }}
                    </span>
                  </button>
                </td>
              </tr>
              <!-- Expanded View -->
              <tr v-if="expandedUsers.has(item.user.accountId)">
                <td colspan="4" class="px-xl py-lg bg-surface-container-low/30">
                  <div v-if="item.inconsistencies.length === 0" class="text-on-surface-variant italic text-sm">
                    No inconsistencies found for this period.
                  </div>
                  <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                    <div v-for="(inc, idx) in item.inconsistencies" :key="idx" 
                         class="p-md rounded-lg border flex flex-col gap-2"
                         :class="{
                           'border-error/30 bg-error-container/10': inc.severity === 'high',
                           'border-amber-500/30 bg-amber-500/10': inc.severity === 'medium',
                           'border-outline-variant bg-surface-container-lowest': inc.severity === 'low'
                         }">
                      <div class="flex justify-between items-center">
                        <span class="text-xs font-bold font-sans">{{ inc.date }}</span>
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase" :class="{
                           'bg-error text-on-error': inc.severity === 'high',
                           'bg-amber-500 text-white': inc.severity === 'medium',
                           'bg-on-surface-variant text-surface': inc.severity === 'low'
                        }">{{ inc.type.replace('_', ' ') }}</span>
                      </div>
                      <p class="text-body-sm">{{ inc.details }}</p>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useJiraStore } from '../stores/jiraStore';
import { useClockworkStore } from '../stores/clockworkStore';

const jiraStore = useJiraStore();
const clockworkStore = useClockworkStore();

const dateFrom = ref(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
const dateTo = ref(new Date().toISOString().split('T')[0]);
const selectedBoardId = ref<number | null>(null);

const expandedUsers = ref(new Set<string>());

const totalUsers = computed(() => clockworkStore.analysis.length);
const totalInconsistencies = computed(() => 
  clockworkStore.analysis.reduce((sum, item) => sum + item.inconsistencies.length, 0)
);
const totalHours = computed(() => 
  clockworkStore.analysis.reduce((sum, item) => sum + (item.totalSeconds / 3600), 0)
);
const avgHoursPerUser = computed(() => 
  totalUsers.value > 0 ? totalHours.value / totalUsers.value : 0
);

function toggleExpand(accountId: string) {
  if (expandedUsers.value.has(accountId)) {
    expandedUsers.value.delete(accountId);
  } else {
    expandedUsers.value.add(accountId);
  }
}

async function refreshAnalysis() {
  const boardId = selectedBoardId.value || jiraStore.defaultBoardId;
  if (boardId) {
    await clockworkStore.fetchAnalysis(boardId, dateFrom.value, dateTo.value);
  }
}

onMounted(async () => {
  // Load config and boards
  await jiraStore.fetchConfig();
  if (jiraStore.defaultBoardId) {
    selectedBoardId.value = jiraStore.defaultBoardId;
  }
  
  if (clockworkStore.analysis.length === 0 && selectedBoardId.value) {
    refreshAnalysis();
  }
});
</script>
