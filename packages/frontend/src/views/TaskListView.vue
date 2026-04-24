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
          <input type="text" placeholder="Search tasks..." class="pl-10 pr-4 py-2 border border-outline-variant rounded-lg font-body-md w-64 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" />
        </div>
        <button class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[18px]">filter_list</span>
          Filter
        </button>
        <button class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[18px]">sort</span>
          Sort
        </button>
      </div>
    </header>
    <div class="grid grid-cols-12 gap-gutter mb-lg">
      <div class="col-span-12 lg:col-span-12">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-outline-variant">
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-24">Task ID</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider">Summary</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-32">Status</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-28">Priority</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-32">Assignee</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr v-if="jiraStore.loading" class="hover:bg-surface-container transition-colors">
                  <td colspan="6" class="px-md py-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined animate-spin text-[24px]">sync</span>
                    <p class="mt-2 font-label-md">Loading tasks...</p>
                  </td>
                </tr>
                <tr v-else-if="jiraStore.error" class="hover:bg-surface-container transition-colors">
                  <td colspan="6" class="px-md py-8 text-center text-error">
                    <span class="material-symbols-outlined text-[24px]">error</span>
                    <p class="mt-2 font-label-md">{{ jiraStore.error }}</p>
                  </td>
                </tr>
                <tr v-else-if="jiraStore.issues.length === 0" class="hover:bg-surface-container transition-colors">
                  <td colspan="6" class="px-md py-8 text-center text-on-surface-variant">
                    <p class="font-label-md">No tasks found.</p>
                  </td>
                </tr>
                <tr v-else v-for="issue in jiraStore.issues" :key="issue.id" class="hover:bg-surface-container transition-colors group cursor-pointer" @click="router.push(`/tasks/${issue.key}`)">
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
            <span class="text-body-sm text-on-surface-variant">Showing {{ jiraStore.issues.length }} tasks</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '../stores/jiraStore';

const router = useRouter();
const jiraStore = useJiraStore();

onMounted(() => {
  // Use default board ID for testing. Assuming 1 for now, but could be loaded from config/user pref
  jiraStore.fetchIssuesForBoard(1);
});
</script>
