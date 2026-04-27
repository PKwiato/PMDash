<template>
  <div class="p-lg max-w-[1400px] mx-auto">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
      <div>
        <nav class="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">
          <span>Projects</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span>JiraMonitor</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span class="text-on-surface">Tasks</span>
        </nav>
        <h1 class="font-headline-xl text-on-surface">Task List</h1>
      </div>

      <div class="flex items-center gap-sm">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search tasks..." 
            class="pl-10 pr-4 py-2 border border-outline-variant rounded-lg font-body-md w-64 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" 
          />
        </div>
        <div class="relative">
          <button 
            @click="showFilterMenu = !showFilterMenu"
            class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors"
            :class="{ 'bg-secondary-container text-on-secondary-container border-secondary': statusFilter || priorityFilter || assigneeFilter }"
          >
            <span class="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
            <span v-if="statusFilter || priorityFilter || assigneeFilter" class="ml-1 w-2 h-2 rounded-full bg-secondary"></span>
          </button>
          
          <div v-if="showFilterMenu" class="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-10 p-2">
            <div class="p-2 border-b border-outline-variant mb-2 flex justify-between items-center">
              <span class="font-label-sm text-on-surface-variant uppercase">Filters</span>
              <button @click="clearFilters" class="text-secondary text-label-sm hover:underline">Clear all</button>
            </div>
            
            <div class="mb-2">
              <label class="px-2 py-1 block text-[10px] font-bold text-on-surface-variant uppercase">Status</label>
              <select v-model="statusFilter" class="w-full bg-transparent p-2 text-body-sm outline-none">
                <option value="">All Statuses</option>
                <option v-for="status in uniqueStatuses" :key="status" :value="status">{{ status }}</option>
              </select>
            </div>
            
            <div class="mb-2">
              <label class="px-2 py-1 block text-[10px] font-bold text-on-surface-variant uppercase">Priority</label>
              <select v-model="priorityFilter" class="w-full bg-transparent p-2 text-body-sm outline-none">
                <option value="">All Priorities</option>
                <option v-for="priority in uniquePriorities" :key="priority" :value="priority">{{ priority }}</option>
              </select>
            </div>

            <div>
              <label class="px-2 py-1 block text-[10px] font-bold text-on-surface-variant uppercase">Assignee</label>
              <select v-model="assigneeFilter" class="w-full bg-transparent p-2 text-body-sm outline-none">
                <option value="">All Assignees</option>
                <option v-for="assignee in uniqueAssignees" :key="assignee" :value="assignee">{{ assignee }}</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="grid grid-cols-12 gap-gutter mb-lg">
      <div class="col-span-12 lg:col-span-12">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-outline-variant">
                  <th @click="toggleSort('key')" class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-24 cursor-pointer hover:text-on-surface transition-colors select-none">
                    <div class="flex items-center gap-1">
                      Task ID
                      <span v-if="sortField === 'key'" class="material-symbols-outlined text-[16px]">{{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th @click="toggleSort('summary')" class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider cursor-pointer hover:text-on-surface transition-colors select-none">
                    <div class="flex items-center gap-1">
                      Summary
                      <span v-if="sortField === 'summary'" class="material-symbols-outlined text-[16px]">{{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th @click="toggleSort('status')" class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-32 cursor-pointer hover:text-on-surface transition-colors select-none">
                    <div class="flex items-center gap-1">
                      Status
                      <span v-if="sortField === 'status'" class="material-symbols-outlined text-[16px]">{{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th @click="toggleSort('priority')" class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-28 cursor-pointer hover:text-on-surface transition-colors select-none">
                    <div class="flex items-center gap-1">
                      Priority
                      <span v-if="sortField === 'priority'" class="material-symbols-outlined text-[16px]">{{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th @click="toggleSort('storyPoints')" class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-16 text-center cursor-pointer hover:text-on-surface transition-colors select-none">
                    <div class="flex items-center justify-center gap-1">
                      Points
                      <span v-if="sortField === 'storyPoints'" class="material-symbols-outlined text-[16px]">{{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th @click="toggleSort('assignee')" class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-32 cursor-pointer hover:text-on-surface transition-colors select-none">
                    <div class="flex items-center gap-1">
                      Assignee
                      <span v-if="sortField === 'assignee'" class="material-symbols-outlined text-[16px]">{{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr v-if="jiraStore.loading" class="hover:bg-surface-container transition-colors">
                  <td colspan="7" class="px-md py-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined animate-spin text-[24px]">sync</span>
                    <p class="mt-2 font-label-md">Loading tasks...</p>
                  </td>
                </tr>
                <tr v-else-if="jiraStore.error" class="hover:bg-surface-container transition-colors">
                  <td colspan="7" class="px-md py-8 text-center text-error">
                    <span class="material-symbols-outlined text-[24px]">error</span>
                    <p class="mt-2 font-label-md">{{ jiraStore.error }}</p>
                  </td>
                </tr>
                <tr v-else-if="filteredAndSortedIssues.length === 0" class="hover:bg-surface-container transition-colors">
                  <td colspan="7" class="px-md py-8 text-center text-on-surface-variant">
                    <p class="font-label-md">No tasks found matching your filters.</p>
                    <button @click="clearFilters" class="mt-2 text-secondary font-label-sm hover:underline">Clear all filters</button>
                  </td>
                </tr>
                <tr v-else v-for="issue in filteredAndSortedIssues" :key="issue.id" class="hover:bg-surface-container transition-colors group cursor-pointer" @click="router.push(`/tasks/${issue.key}`)">
                  <td class="px-md py-3 font-label-md text-secondary">{{ issue.key }}</td>
                  <td class="px-md py-3">
                    <div class="flex flex-col">
                      <span class="font-body-md font-semibold text-on-surface">{{ issue.summary }}</span>
                      <span class="text-label-sm text-on-surface-variant">{{ issue.issueType }}</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium" :class="{
                      'bg-green-100 text-green-800': issue.status === 'Done',
                      'bg-secondary-container text-on-secondary-fixed-variant': issue.status === 'In Progress',
                      'bg-surface-container-high text-on-surface-variant': !['Done', 'In Progress'].includes(issue.status)
                    }">
                      {{ issue.status }}
                    </span>
                  </td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <span class="w-1.5 h-6 rounded-full" :class="{
                        'bg-error': issue.priority === 'High' || issue.priority === 'Highest',
                        'bg-tertiary-container': issue.priority === 'Medium',
                        'bg-outline-variant': issue.priority === 'Low' || issue.priority === 'Lowest'
                      }"></span>
                      <span class="font-label-md text-on-surface">{{ issue.priority }}</span>
                    </div>
                  </td>
                  <td class="px-md py-3 text-center">
                    <span v-if="issue.storyPoints" class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-label-md border border-indigo-100">
                      {{ issue.storyPoints }}
                    </span>
                    <span v-else class="text-on-surface-variant text-[20px] material-symbols-outlined opacity-20">horizontal_rule</span>
                  </td>
                  <td class="px-md py-3">
                    <div v-if="issue.assignee" class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] text-white">{{ issue.assignee.charAt(0) }}</div>
                      <span class="text-body-sm">{{ issue.assignee }}</span>
                    </div>
                    <div v-else class="text-body-sm text-on-surface-variant">Unassigned</div>
                  </td>
                  <td class="px-md py-3 text-right">
                    <button class="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-outline hover:text-on-surface" @click.stop>
                      <span class="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-md py-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
            <span class="text-body-sm text-on-surface-variant">Showing {{ filteredAndSortedIssues.length }} of {{ jiraStore.issues.length }} tasks</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '../stores/jiraStore';

const router = useRouter();
const jiraStore = useJiraStore();

// State for search, filter, and sort
const searchQuery = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');
const assigneeFilter = ref('');
const showFilterMenu = ref(false);
const sortField = ref('key');
const sortOrder = ref('asc');

// Options for filters
const uniqueStatuses = computed(() => {
  const statuses = new Set(jiraStore.issues.map(i => i.status));
  return Array.from(statuses).sort();
});

const uniquePriorities = computed(() => {
  const priorities = new Set(jiraStore.issues.map(i => i.priority));
  return Array.from(priorities).sort();
});

const uniqueAssignees = computed(() => {
  const assignees = new Set(jiraStore.issues.filter(i => i.assignee).map(i => i.assignee));
  return Array.from(assignees).sort();
});

const filteredAndSortedIssues = computed(() => {
  let result = [...jiraStore.issues];

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(i => 
      i.key.toLowerCase().includes(q) || 
      i.summary.toLowerCase().includes(q) ||
      (i.assignee && i.assignee.toLowerCase().includes(q))
    );
  }

  // Filters
  if (statusFilter.value) {
    result = result.filter(i => i.status === statusFilter.value);
  }
  if (priorityFilter.value) {
    result = result.filter(i => i.priority === priorityFilter.value);
  }
  if (assigneeFilter.value) {
    if (assigneeFilter.value === 'Unassigned') {
      result = result.filter(i => !i.assignee);
    } else {
      result = result.filter(i => i.assignee === assigneeFilter.value);
    }
  }

  // Sorting
  result.sort((a: any, b: any) => {
    let fieldA = a[sortField.value];
    let fieldB = b[sortField.value];
    
    // Custom logic for priority weight
    if (sortField.value === 'priority') {
        const weights: Record<string, number> = { 
          'highest': 5, 'critical': 5, 'najwyższy': 5,
          'high': 4, 'major': 4, 'wysoki': 4,
          'medium': 3, 'średni': 3, 'average': 3,
          'low': 2, 'minor': 2, 'niski': 2,
          'lowest': 1, 'trivial': 1, 'najniższy': 1 
        };
        const aVal = String(fieldA || '').toLowerCase().trim();
        const bVal = String(fieldB || '').toLowerCase().trim();
        fieldA = weights[aVal] !== undefined ? weights[aVal] : 0;
        fieldB = weights[bVal] !== undefined ? weights[bVal] : 0;
        
        // If both are 0 (unknown), fall back to alphabetical sort of the original values
        if (fieldA === 0 && fieldB === 0) {
          fieldA = aVal;
          fieldB = bVal;
        }
    }

    // Equality check
    if (fieldA === fieldB) return 0;

    // Handle nulls/undefined for other fields
    if (fieldA === null || fieldA === undefined) return 1;
    if (fieldB === null || fieldB === undefined) return -1;

    // Generic comparison
    if (fieldA < fieldB) return sortOrder.value === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
});

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
}

function clearFilters() {
  statusFilter.value = '';
  priorityFilter.value = '';
  assigneeFilter.value = '';
  searchQuery.value = '';
}

onMounted(async () => {
  await jiraStore.fetchConfig();
  jiraStore.fetchIssuesForBoard();
});
</script>
