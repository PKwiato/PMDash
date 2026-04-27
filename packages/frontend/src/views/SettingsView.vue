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

      <!-- Notes Storage Section -->
      <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary text-[24px]">folder_managed</span>
            <h2 class="font-headline-md text-on-surface">Notes Storage Configuration</h2>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full" :class="vaultStore.activeMode === 'production' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'">
            <span class="material-symbols-outlined text-[18px]">{{ vaultStore.activeMode === 'production' ? 'diamond' : 'science' }}</span>
            <span class="font-label-md uppercase tracking-wider">{{ vaultStore.activeMode }} Mode</span>
          </div>
        </div>

        <div class="space-y-6">
          <p class="text-body-md text-on-surface-variant leading-relaxed">
            Configure where your notes are stored. You can maintain a separate <strong>Test Vault</strong> for experimenting with new features without affecting your primary notes.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Production Dir -->
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">diamond</span>
                Production Directory (Original Notes)
              </label>
              <input 
                v-model="vaultConfig.productionDir"
                type="text" 
                placeholder="e.g. C:/Users/Notes" 
                class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 font-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            <!-- Test Dir -->
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">science</span>
                Test Directory (For Testing)
              </label>
              <input 
                v-model="vaultConfig.testDir"
                type="text" 
                placeholder="e.g. C:/Users/TestNotes" 
                class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 font-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-outline-variant">
            <div class="flex flex-col">
              <span class="font-title-md text-on-surface">Active Storage Mode</span>
              <span class="text-body-sm text-on-surface-variant">Switching will immediately reload project data from the selected source.</span>
            </div>
            
            <div class="flex items-center gap-4">
              <button 
                @click="toggleMode"
                class="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all active:scale-95 shadow-sm"
                :class="vaultStore.activeMode === 'production' 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'"
              >
                <span class="material-symbols-outlined text-[20px]">swap_horiz</span>
                Switch to {{ vaultStore.activeMode === 'production' ? 'Test' : 'Production' }}
              </button>

              <button 
                @click="saveVaultConfig" 
                class="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                :disabled="savingVault || !isVaultConfigDirty"
              >
                <span v-if="savingVault" class="material-symbols-outlined animate-spin text-[18px]">sync</span>
                <span v-else>Save Paths</span>
              </button>
            </div>
          </div>
          
          <p v-if="vaultSaveSuccess" class="text-green-600 text-label-sm mt-1 flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">check_circle</span>
            Vault paths saved successfully!
          </p>
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
import { useVaultStore } from '../stores/vaultStore';
import { reactive } from 'vue';

interface Board {
  id: number;
  name: string;
  type: string;
}

const jiraStore = useJiraStore();
const vaultStore = useVaultStore();

const boards = ref<Board[]>([]);
const boardSearchQuery = ref('');
const selectedBoardId = ref<number | null>(null);
const loadingBoards = ref(false);
const saving = ref(false);
const saveSuccess = ref(false);

// Vault Settings
const vaultConfig = reactive({
  productionDir: '',
  testDir: '',
});
const savingVault = ref(false);
const vaultSaveSuccess = ref(false);

const isVaultConfigDirty = computed(() => {
  return vaultConfig.productionDir !== vaultStore.productionDir || 
         vaultConfig.testDir !== vaultStore.testDir;
});

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

async function saveVaultConfig() {
  savingVault.value = true;
  vaultSaveSuccess.value = false;
  
  const success = await vaultStore.updateSettings({
    productionDir: vaultConfig.productionDir,
    testDir: vaultConfig.testDir
  });
  
  if (success) {
    vaultSaveSuccess.value = true;
    setTimeout(() => {
      vaultSaveSuccess.value = false;
    }, 3000);
  }
  
  savingVault.value = false;
}

async function toggleMode() {
  const confirmMsg = `Are you sure you want to switch to ${vaultStore.activeMode === 'production' ? 'TEST' : 'PRODUCTION'} mode? The application will reload data from the new path.`;
  if (confirm(confirmMsg)) {
    await vaultStore.toggleMode();
    // Optional: reload page to ensure all components refresh data from the new source
    window.location.reload();
  }
}

onMounted(async () => {
  await Promise.all([
    jiraStore.fetchConfig(),
    vaultStore.fetchSettings()
  ]);
  
  selectedBoardId.value = jiraStore.defaultBoardId;
  
  // Initialize local reactive state from store
  vaultConfig.productionDir = vaultStore.productionDir;
  vaultConfig.testDir = vaultStore.testDir;
  
  fetchBoards();
});
</script>
