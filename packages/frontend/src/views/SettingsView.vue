<template>
  <div class="p-lg max-w-[800px] mx-auto">
    <header class="mb-lg">
      <nav class="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">
        <span>Settings</span>
        <span class="material-symbols-outlined text-[12px]">chevron_right</span>
        <span class="text-on-surface">Jira Configuration</span>
      </nav>
      <h1 class="font-headline-xl text-on-surface">Settings</h1>
    </header>

    <div class="space-y-6">
      <!-- Jira Board Section -->
      <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3 mb-6">
          <span class="material-symbols-outlined text-secondary text-[24px]">settings_suggest</span>
          <h2 class="font-headline-md text-on-surface">Jira Board Configuration</h2>
        </div>

        <div class="space-y-4">
          <p class="text-body-md text-on-surface-variant leading-relaxed">
            Select the default Jira Board for this workspace. This board will be used as the primary source for the Task List and Kanban views.
          </p>

          <div class="flex flex-col gap-2">
            <label class="font-label-md text-on-surface-variant">Default Board ID</label>
            <div class="flex flex-col gap-3">
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input 
                  v-model="boardSearchQuery" 
                  type="text" 
                  placeholder="Type to search boards..." 
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 font-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                />
              </div>
              <div class="flex gap-3">
                <select 
                  v-model="selectedBoardId" 
                  class="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 font-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all disabled:opacity-50"
                  :disabled="loadingBoards"
                >
                  <option :value="null" disabled>Select a board...</option>
                  <option v-for="board in filteredBoards" :key="board.id" :value="board.id">
                    {{ board.name }} (ID: {{ board.id }})
                  </option>
                </select>
                <button 
                  @click="saveBoardConfig" 
                  class="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                  :disabled="saving || !selectedBoardId || selectedBoardId === jiraStore.defaultBoardId"
                >
                  <span v-if="saving" class="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span v-else>Save Changes</span>
                </button>
              </div>
            </div>
            <p v-if="saveSuccess" class="text-green-600 text-label-sm mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              Configuration saved successfully!
            </p>
          </div>
        </div>
      </section>

      <!-- Advanced Section -->
      <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 opacity-50 pointer-events-none">
        <div class="flex items-center gap-3 mb-6">
          <span class="material-symbols-outlined text-on-surface-variant text-[24px]">api</span>
          <h2 class="font-headline-md text-on-surface">API Connection</h2>
        </div>
        <p class="text-body-sm italic">Manage your Jira Base URL and Personal Access Tokens (Coming soon).</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useJiraStore } from '../stores/jiraStore';

interface Board {
  id: number;
  name: string;
  type: string;
}

const jiraStore = useJiraStore();
const boards = ref<Board[]>([]);
const boardSearchQuery = ref('');
const selectedBoardId = ref<number | null>(null);
const loadingBoards = ref(false);
const saving = ref(false);
const saveSuccess = ref(false);

const filteredBoards = computed(() => {
  if (!boardSearchQuery.value) return boards.value;
  const query = boardSearchQuery.value.toLowerCase();
  return boards.value.filter(b => 
    b.name.toLowerCase().includes(query) || 
    b.id.toString().includes(query)
  );
});

// Auto-select first matching board as user types
watch(boardSearchQuery, (newQuery) => {
  if (newQuery && filteredBoards.value.length > 0) {
    selectedBoardId.value = filteredBoards.value[0].id;
  }
});

async function fetchBoards() {
  loadingBoards.value = true;
  try {
    const response = await axios.get<Board[]>('/api/jira/boards');
    boards.value = response.data;
  } catch (err) {
    console.error('Error fetching boards:', err);
  } finally {
    loadingBoards.value = false;
  }
}

async function saveBoardConfig() {
  if (!selectedBoardId.value) return;
  
  saving.value = true;
  saveSuccess.value = false;
  
  const success = await jiraStore.updateConfig(selectedBoardId.value);
  
  if (success) {
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  }
  
  saving.value = false;
}

onMounted(async () => {
  await jiraStore.fetchConfig();
  selectedBoardId.value = jiraStore.defaultBoardId;
  fetchBoards();
});
</script>
