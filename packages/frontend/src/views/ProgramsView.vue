<template>
  <div class="max-w-[1600px] mx-auto p-md lg:p-lg pb-24">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-lg">
      <div>
        <h1 class="font-headline-xl text-2xl font-bold text-on-surface tracking-tight">Programs</h1>
        <p class="font-body-sm text-on-surface-variant mt-1">{{ sprintContextLine }}</p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-body-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
        :disabled="jiraStore.loading"
        @click="refresh"
      >
        <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': jiraStore.loading }">refresh</span>
        Refresh
      </button>
    </div>

    <div v-if="jiraStore.loading && !jiraStore.issues.length" class="py-20 text-center text-on-surface-variant">
      <span class="material-symbols-outlined animate-spin text-4xl">sync</span>
      <p class="mt-3 font-label-md">Loading programs…</p>
    </div>

    <template v-else>
      <!-- Top metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg max-w-2xl">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Completion Rate</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-on-surface">{{ overview.completionRate }}%</span>
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mb-1">
              <span class="material-symbols-outlined text-[14px]">trending_up</span>
              {{ overview.doneTasks }}/{{ overview.totalTasks }}
            </span>
          </div>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Critical Risks</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-on-surface">{{ overview.blockedCount }}</span>
            <span class="text-xs font-semibold text-error flex items-center gap-0.5 mb-1">
              <span class="material-symbols-outlined text-[14px]">error</span>
              blocked
            </span>
          </div>
        </div>
      </div>

      <!-- Active Programs -->
      <section class="mb-xl">
        <div class="flex items-center justify-between mb-md">
          <h2 class="text-lg font-bold text-on-surface">Active Programs</h2>
          <button
            v-if="selectedProgramKey"
            type="button"
            class="text-xs font-bold text-secondary hover:underline"
            @click="selectedProgramKey = null"
          >
            Clear filter
          </button>
        </div>

        <div v-if="programs.length === 0" class="text-on-surface-variant text-body-sm py-8 text-center border border-dashed border-outline-variant rounded-xl">
          No programs found on this board. Link tasks to epics or programs in Jira.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
          <article
            v-for="program in programs"
            :key="program.key"
            class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            :class="{ 'ring-2 ring-secondary': selectedProgramKey === program.key }"
            @click="toggleProgramFilter(program.key)"
          >
            <div class="flex items-start gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                :style="{ backgroundColor: program.themeColor + '33', color: program.themeColor }"
              >
                <span class="material-symbols-outlined text-[22px]">layers</span>
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-bold text-on-surface text-sm leading-tight truncate" :title="program.summary">
                  {{ program.summary }}
                </h3>
                <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-high text-on-surface-variant">
                  {{ program.issueType }}
                </span>
              </div>
            </div>

            <div class="mb-2">
              <div class="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
                <span>Progress</span>
                <span>{{ program.progressPercent }}%</span>
              </div>
              <div class="h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{ width: `${program.progressPercent}%`, backgroundColor: program.themeColor }"
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center border-t border-outline-variant pt-3 mt-3">
              <div>
                <p class="text-lg font-bold text-on-surface">{{ program.todo }}</p>
                <p class="text-[9px] font-bold uppercase text-on-surface-variant">To Do</p>
              </div>
              <div>
                <p class="text-lg font-bold text-on-surface">{{ program.inProgress }}</p>
                <p class="text-[9px] font-bold uppercase text-on-surface-variant">In Progress</p>
              </div>
              <div>
                <p class="text-lg font-bold text-on-surface">{{ program.done }}</p>
                <p class="text-[9px] font-bold uppercase text-on-surface-variant">Done</p>
              </div>
            </div>

            <div class="flex items-center justify-between mt-3 pt-2 text-[10px] text-on-surface-variant">
              <span class="font-mono">{{ program.key }}</span>
              <span v-if="program.blocked > 0" class="text-error font-bold flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[12px]">warning</span>
                {{ program.blocked }} blocked
              </span>
              <span v-else-if="program.progressPercent >= 90" class="text-emerald-600 font-bold">Launch ready</span>
            </div>
          </article>
        </div>
      </section>

      <!-- Tasks table -->
      <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div class="px-md py-4 border-b border-outline-variant flex items-center justify-between gap-4">
          <h2 class="text-lg font-bold text-on-surface">
            {{ selectedProgramKey ? `Tasks — ${selectedProgramTitle}` : 'All Tasks' }}
          </h2>
          <div class="flex items-center gap-2">
            <select
              v-model="statusFilter"
              class="text-xs border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest text-on-surface outline-none"
            >
              <option value="">All statuses</option>
              <option value="ON TRACK">On track</option>
              <option value="AT RISK">At risk</option>
              <option value="IN REVIEW">In review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th class="px-md py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Task</th>
                <th class="px-md py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Program</th>
                <th class="px-md py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Owner</th>
                <th class="px-md py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Updated</th>
                <th class="px-md py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr
                v-for="row in tableRows"
                :key="row.issue.key"
                class="hover:bg-surface-container transition-colors cursor-pointer"
                @click="router.push(`/tasks/${row.issue.key}`)"
              >
                <td class="px-md py-3">
                  <p class="font-semibold text-sm text-on-surface">{{ row.issue.summary }}</p>
                  <p class="text-[11px] text-on-surface-variant font-mono mt-0.5">{{ row.issue.key }}</p>
                </td>
                <td class="px-md py-3">
                  <JiraEpicLabel v-if="row.programRef" :issue="row.programRef" class="max-w-[200px]" />
                  <span v-else class="text-xs text-on-surface-variant">—</span>
                </td>
                <td class="px-md py-3">
                  <div v-if="row.issue.assignee" class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-bold">
                      <img v-if="row.issue.assigneeAvatarUrl" :src="row.issue.assigneeAvatarUrl" :alt="row.issue.assignee" class="w-full h-full object-cover" />
                      <span v-else>{{ row.issue.assignee.charAt(0) }}</span>
                    </div>
                    <span class="text-sm text-on-surface">{{ row.issue.assignee }}</span>
                  </div>
                  <span v-else class="text-sm text-on-surface-variant">Unassigned</span>
                </td>
                <td class="px-md py-3 text-sm text-on-surface-variant whitespace-nowrap">
                  {{ formatProgramDate(row.issue.created) }}
                </td>
                <td class="px-md py-3 text-center">
                  <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide" :class="statusBadgeClass(row.statusLabel)">
                    {{ row.statusLabel }}
                  </span>
                </td>
              </tr>
              <tr v-if="tableRows.length === 0">
                <td colspan="5" class="px-md py-10 text-center text-on-surface-variant text-sm">
                  No tasks match the current filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '../stores/jiraStore';
import JiraEpicLabel from '../components/JiraEpicLabel.vue';
import {
  buildProgramsFromIssues,
  computeProgramsOverviewStats,
  formatProgramDate,
  taskDisplayStatus,
  taskProgramKey,
  type ProgramTaskStatusLabel,
} from '../utils/jiraPrograms';
import { programBadgeForIssue } from '../utils/jiraIssueHierarchy';
const router = useRouter();
const jiraStore = useJiraStore();

const selectedProgramKey = ref<string | null>(null);
const statusFilter = ref<ProgramTaskStatusLabel | ''>('');

const programs = computed(() => buildProgramsFromIssues(jiraStore.issues));

const overview = computed(() => computeProgramsOverviewStats(jiraStore.issues));

const selectedProgramTitle = computed(() => {
  if (!selectedProgramKey.value) return '';
  return programs.value.find(p => p.key === selectedProgramKey.value)?.summary ?? selectedProgramKey.value;
});

const tableRows = computed(() => {
  const programByKey = new Map(programs.value.map(p => [p.key.toUpperCase(), p]));
  let tasks = jiraStore.issues.filter(i => taskProgramKey(i));

  if (selectedProgramKey.value) {
    const k = selectedProgramKey.value.toUpperCase();
    tasks = tasks.filter(i => taskProgramKey(i)?.toUpperCase() === k);
  }

  const rows = tasks.map(issue => {
    const pk = taskProgramKey(issue)!;
    const program = programByKey.get(pk.toUpperCase());
    const statusLabel = taskDisplayStatus(issue);
    const programRef = programBadgeForIssue(issue, jiraStore.issues) ?? (program
      ? {
          id: program.key,
          key: program.key,
          summary: program.summary,
          status: 'Unknown',
          priority: 'Medium',
          issueType: program.issueType,
          color: program.color,
        }
      : null);
    return { issue, statusLabel, programRef };
  });

  if (statusFilter.value) {
    return rows.filter(r => r.statusLabel === statusFilter.value);
  }

  return rows.sort((a, b) => a.issue.summary.localeCompare(b.issue.summary, 'pl'));
});

const sprintContextLine = computed(() => {
  const board = jiraStore.boardName;
  if (!jiraStore.defaultBoardId) return 'Set a default Jira board in Settings.';
  return `Programs from board epics, project Epic/Program/Initiative issues, and all paginated board issues on ${board}.`;
});

function statusBadgeClass(label: ProgramTaskStatusLabel): string {
  if (label === 'ON TRACK') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
  if (label === 'AT RISK') return 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
  if (label === 'IN REVIEW') return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
  return 'bg-surface-container-high text-on-surface-variant';
}

function toggleProgramFilter(key: string) {
  selectedProgramKey.value = selectedProgramKey.value === key ? null : key;
}

async function refresh() {
  await jiraStore.fetchConfig();
  await jiraStore.fetchProgramsOverview();
}

onMounted(() => {
  void refresh();
});
</script>
