<template>
  <div class="max-w-[1600px] mx-auto p-md lg:p-lg pb-24">
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-md">
      <div>
        <h1 class="font-headline-xl text-2xl font-bold text-on-surface tracking-tight">Programs</h1>
        <p class="font-body-sm text-on-surface-variant mt-1">{{ sprintContextLine }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <div class="relative flex-1 min-w-[200px] lg:flex-none lg:w-72">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search programs and tasks…"
            class="w-full pl-10 pr-9 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-surface-container-lowest text-on-surface"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            @click="searchQuery = ''"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-body-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          :class="{ 'bg-secondary-container/30 border-secondary': hasActiveFilters }"
          @click="showFilterPanel = !showFilterPanel"
        >
          <span class="material-symbols-outlined text-[18px]">filter_list</span>
          Filters
          <span v-if="activeFilterCount > 0" class="min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-on-secondary text-[10px] font-black flex items-center justify-center">
            {{ activeFilterCount }}
          </span>
        </button>
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
    </div>

    <!-- Filters panel -->
    <section
      v-if="showFilterPanel"
      class="mb-lg bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm"
    >
      <div class="flex items-center justify-between gap-4 mb-4">
        <h2 class="text-sm font-bold text-on-surface uppercase tracking-wider">Filters</h2>
        <button type="button" class="text-xs font-bold text-secondary hover:underline" @click="clearFilters">
          Clear all
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
        <div class="md:col-span-2 xl:col-span-2">
          <label class="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            STATSCORE Team
            <span class="normal-case font-normal text-on-surface-variant/80">(default: {{ boardTeamHint || 'current board' }})</span>
          </label>
          <div v-if="uniqueStatscoreTeams.length === 0" class="text-xs text-on-surface-variant py-2">
            No STATSCORE Team values in loaded programs.
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <label
              v-for="team in uniqueStatscoreTeams"
              :key="team"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors"
              :class="selectedTeams.includes(team)
                ? 'border-secondary bg-secondary-container/25 text-secondary'
                : 'border-outline-variant text-on-surface-variant hover:border-outline'"
            >
              <input v-model="selectedTeams" type="checkbox" :value="team" class="rounded border-outline-variant text-secondary focus:ring-secondary" />
              {{ team }}
            </label>
            <label
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors"
              :class="includeUnassignedTeams
                ? 'border-secondary bg-secondary-container/25 text-secondary'
                : 'border-outline-variant text-on-surface-variant hover:border-outline'"
            >
              <input v-model="includeUnassignedTeams" type="checkbox" class="rounded border-outline-variant text-secondary focus:ring-secondary" />
              Unassigned
            </label>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Issue type</label>
          <select v-model="issueTypeFilter" class="w-full text-sm border border-outline-variant rounded-lg px-2 py-2 bg-surface-container-lowest text-on-surface outline-none">
            <option value="">All types</option>
            <option v-for="t in uniqueIssueTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Program status</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in lifecycleOptions"
              :key="opt.value"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
              :class="programLifecycleFilter === opt.value
                ? 'border-secondary bg-secondary-container/25 text-secondary'
                : 'border-outline-variant text-on-surface-variant hover:border-outline'"
              @click="programLifecycleFilter = opt.value"
            >
              {{ opt.label }}
              <span class="ml-1 opacity-70">({{ lifecycleCounts[opt.countKey] }})</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Linked tasks</label>
          <select v-model="progressFilter" class="w-full text-sm border border-outline-variant rounded-lg px-2 py-2 bg-surface-container-lowest text-on-surface outline-none">
            <option value="">Any</option>
            <option value="has_tasks">Has linked tasks</option>
            <option value="no_tasks">No linked tasks</option>
            <option value="blocked">Has blocked tasks</option>
            <option value="launch_ready">Launch ready (≥90%)</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Task status label</label>
          <select v-model="statusFilter" class="w-full text-sm border border-outline-variant rounded-lg px-2 py-2 bg-surface-container-lowest text-on-surface outline-none">
            <option value="">All statuses</option>
            <option value="ON TRACK">On track</option>
            <option value="AT RISK">At risk</option>
            <option value="IN REVIEW">In review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Assignee</label>
          <select v-model="assigneeFilter" class="w-full text-sm border border-outline-variant rounded-lg px-2 py-2 bg-surface-container-lowest text-on-surface outline-none">
            <option value="">All assignees</option>
            <option value="__unassigned__">Unassigned</option>
            <option v-for="a in uniqueAssignees" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Priority</label>
          <select v-model="priorityFilter" class="w-full text-sm border border-outline-variant rounded-lg px-2 py-2 bg-surface-container-lowest text-on-surface outline-none">
            <option value="">All priorities</option>
            <option v-for="p in uniquePriorities" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
      </div>

      <p class="mt-3 text-[11px] text-on-surface-variant">
        Showing {{ filteredPrograms.length }} of {{ allPrograms.length }} programs
        · {{ filteredTableRows.length }} tasks
        <span v-if="boardTeamHint"> · Board team: <strong class="text-on-surface">{{ boardTeamHint }}</strong></span>
      </p>
      <div
        v-if="filterHint"
        class="mt-3 flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs"
      >
        <span class="material-symbols-outlined text-[16px]">info</span>
        <span class="flex-1 min-w-[200px]">{{ filterHint }}</span>
        <button
          v-if="teamFilterBlocksResults"
          type="button"
          class="font-bold underline hover:no-underline"
          @click="showAllTeams"
        >
          Show all teams
        </button>
      </div>
    </section>

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
          <h2 class="text-lg font-bold text-on-surface">{{ programsSectionTitle }}</h2>
          <button
            v-if="selectedProgramKey"
            type="button"
            class="text-xs font-bold text-secondary hover:underline"
            @click="selectedProgramKey = null"
          >
            Clear filter
          </button>
        </div>

        <div v-if="allPrograms.length === 0" class="text-on-surface-variant text-body-sm py-8 text-center border border-dashed border-outline-variant rounded-xl">
          No programs found on this board. Link tasks to epics or programs in Jira.
        </div>
        <div v-else-if="filteredPrograms.length === 0" class="text-on-surface-variant text-body-sm py-8 text-center border border-dashed border-outline-variant rounded-xl">
          No programs match the current filters.
          <button type="button" class="block mx-auto mt-2 text-secondary font-bold hover:underline" @click="clearFilters">Clear filters</button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
          <article
            v-for="program in filteredPrograms"
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
                <div class="flex flex-wrap gap-1 mt-1">
                  <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-high text-on-surface-variant">
                    {{ program.issueType }}
                  </span>
                  <span
                    v-if="program.statscoreTeam"
                    class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/30 text-secondary"
                    :title="`STATSCORE Team: ${program.statscoreTeam}`"
                  >
                    {{ program.statscoreTeam }}
                  </span>
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="isProgramCompleted(program)
                      ? 'bg-surface-container-high text-on-surface-variant'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'"
                    :title="program.status"
                  >
                    {{ isProgramCompleted(program) ? 'Completed' : 'Active' }}
                  </span>
                </div>
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
            <span class="text-sm font-normal text-on-surface-variant">({{ filteredTableRows.length }})</span>
          </h2>
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
                v-for="row in filteredTableRows"
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
              <tr v-if="filteredTableRows.length === 0">
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '../stores/jiraStore';
import JiraEpicLabel from '../components/JiraEpicLabel.vue';
import {
  buildProgramsFromIssues,
  collectStatscoreTeams,
  computeProgramsOverviewStats,
  formatProgramDate,
  isProgramCompleted,
  programMatchesLifecycleFilter,
  taskDisplayStatus,
  taskProgramKey,
  type ProgramLifecycleFilter,
  type ProgramSummary,
  type ProgramTaskStatusLabel,
} from '../utils/jiraPrograms';
import { programBadgeForIssue } from '../utils/jiraIssueHierarchy';
import { isProgramIssueType } from '../utils/jiraEpicColors';
import {
  defaultTeamFilterForBoard,
  issueMatchesSearch,
  teamLabelFromBoardName,
  teamMatchesSelection,
} from '../utils/jiraTeamFilter';

const router = useRouter();
const jiraStore = useJiraStore();

const searchQuery = ref('');
const showFilterPanel = ref(true);
const selectedProgramKey = ref<string | null>(null);
const statusFilter = ref<ProgramTaskStatusLabel | ''>('');
const assigneeFilter = ref('');
const priorityFilter = ref('');
const issueTypeFilter = ref('');
const progressFilter = ref<'' | 'has_tasks' | 'no_tasks' | 'blocked' | 'launch_ready'>('');
const programLifecycleFilter = ref<ProgramLifecycleFilter>('active');
const selectedTeams = ref<string[]>([]);

const lifecycleOptions: { value: ProgramLifecycleFilter; label: string; countKey: 'all' | 'active' | 'completed' }[] = [
  { value: 'active', label: 'Active', countKey: 'active' },
  { value: 'completed', label: 'Completed', countKey: 'completed' },
  { value: '', label: 'All', countKey: 'all' },
];
const includeUnassignedTeams = ref(false);
const teamFilterInitialized = ref(false);

const allPrograms = computed(() => buildProgramsFromIssues(jiraStore.issues));

const lifecycleCounts = computed(() => {
  let active = 0;
  let completed = 0;
  for (const p of allPrograms.value) {
    if (isProgramCompleted(p)) completed += 1;
    else active += 1;
  }
  return { all: allPrograms.value.length, active, completed };
});

const programsSectionTitle = computed(() => {
  if (programLifecycleFilter.value === 'completed') return 'Completed Programs';
  if (programLifecycleFilter.value === 'active') return 'Active Programs';
  return 'All Programs';
});

const uniqueStatscoreTeams = computed(() => collectStatscoreTeams(allPrograms.value));
const boardTeamHint = computed(() => teamLabelFromBoardName(jiraStore.boardName));

const uniqueIssueTypes = computed(() =>
  [...new Set(allPrograms.value.map(p => p.issueType))].sort((a, b) => a.localeCompare(b, 'pl')),
);

const uniqueAssignees = computed(() => {
  const set = new Set<string>();
  for (const i of jiraStore.issues) {
    if (i.assignee) set.add(i.assignee);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pl'));
});

const uniquePriorities = computed(() => {
  const set = new Set<string>();
  for (const i of jiraStore.issues) {
    if (i.priority) set.add(i.priority);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pl'));
});

function applyDefaultTeamFilter() {
  selectedTeams.value = defaultTeamFilterForBoard(jiraStore.boardName, uniqueStatscoreTeams.value);
  includeUnassignedTeams.value = false;
  teamFilterInitialized.value = true;
}

watch(
  () => [jiraStore.boardName, uniqueStatscoreTeams.value.join('|')] as const,
  () => {
    if (uniqueStatscoreTeams.value.length === 0 && !teamFilterInitialized.value) return;
    applyDefaultTeamFilter();
  },
  { immediate: true },
);

watch(
  () => jiraStore.defaultBoardId,
  () => {
    teamFilterInitialized.value = false;
  },
);

function programMatchesFilters(program: ProgramSummary): boolean {
  if (!programMatchesLifecycleFilter(program, programLifecycleFilter.value)) return false;
  if (!teamMatchesSelection(program.statscoreTeam, selectedTeams.value, { includeUnassigned: includeUnassignedTeams.value })) {
    return false;
  }
  if (issueTypeFilter.value && program.issueType !== issueTypeFilter.value) return false;
  if (progressFilter.value === 'has_tasks' && program.total === 0) return false;
  if (progressFilter.value === 'no_tasks' && program.total > 0) return false;
  if (progressFilter.value === 'blocked' && program.blocked === 0) return false;
  if (progressFilter.value === 'launch_ready' && program.progressPercent < 90) return false;
  if (!issueMatchesSearch(program.summary, program.key, program.statscoreTeam, searchQuery.value)) return false;
  if (selectedProgramKey.value && program.key.toUpperCase() !== selectedProgramKey.value.toUpperCase()) return false;
  return true;
}

const filteredPrograms = computed(() => allPrograms.value.filter(programMatchesFilters));

function programMatchesFiltersExceptTeam(program: ProgramSummary): boolean {
  if (!programMatchesLifecycleFilter(program, programLifecycleFilter.value)) return false;
  if (issueTypeFilter.value && program.issueType !== issueTypeFilter.value) return false;
  if (progressFilter.value === 'has_tasks' && program.total === 0) return false;
  if (progressFilter.value === 'no_tasks' && program.total > 0) return false;
  if (progressFilter.value === 'blocked' && program.blocked === 0) return false;
  if (progressFilter.value === 'launch_ready' && program.progressPercent < 90) return false;
  if (!issueMatchesSearch(program.summary, program.key, program.statscoreTeam, searchQuery.value)) return false;
  if (selectedProgramKey.value && program.key.toUpperCase() !== selectedProgramKey.value.toUpperCase()) return false;
  return true;
}

const programsHiddenByTeamFilter = computed(() =>
  allPrograms.value.filter(
    p => programMatchesFiltersExceptTeam(p) && !teamMatchesSelection(p.statscoreTeam, selectedTeams.value, { includeUnassigned: includeUnassignedTeams.value }),
  ),
);

const teamFilterBlocksResults = computed(
  () => programsHiddenByTeamFilter.value.length > 0 && filteredPrograms.value.length === 0,
);

const filterHint = computed(() => {
  if (teamFilterBlocksResults.value) {
    const names = programsHiddenByTeamFilter.value.slice(0, 3).map(p => p.summary).join(', ');
    const extra = programsHiddenByTeamFilter.value.length > 3 ? ` (+${programsHiddenByTeamFilter.value.length - 3} more)` : '';
    return `${programsHiddenByTeamFilter.value.length} program(s) match your filters but are hidden by STATSCORE Team (e.g. ${names}${extra}).`;
  }
  if (searchQuery.value.trim() && filteredPrograms.value.length === 0 && allPrograms.value.length > 0) {
    return 'No programs match the search. Try clearing filters or searching by Jira key.';
  }
  return null;
});

function showAllTeams() {
  selectedTeams.value = [...uniqueStatscoreTeams.value];
  includeUnassignedTeams.value = true;
}

const allowedProgramKeys = computed(() => new Set(filteredPrograms.value.map(p => p.key.toUpperCase())));

const overview = computed(() => {
  const tasks = jiraStore.issues.filter(i => {
    if (isProgramIssueType(i.issueType)) return false;
    const pk = taskProgramKey(i);
    return pk && allowedProgramKeys.value.has(pk.toUpperCase());
  });
  return computeProgramsOverviewStats(tasks);
});

const selectedProgramTitle = computed(() => {
  if (!selectedProgramKey.value) return '';
  return allPrograms.value.find(p => p.key === selectedProgramKey.value)?.summary ?? selectedProgramKey.value;
});

const filteredTableRows = computed(() => {
  const programByKey = new Map(filteredPrograms.value.map(p => [p.key.toUpperCase(), p]));
  let tasks = jiraStore.issues.filter(i => {
    const pk = taskProgramKey(i);
    return pk && allowedProgramKeys.value.has(pk.toUpperCase());
  });

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

  let result = rows;
  if (statusFilter.value) {
    result = result.filter(r => r.statusLabel === statusFilter.value);
  }
  if (assigneeFilter.value === '__unassigned__') {
    result = result.filter(r => !r.issue.assignee);
  } else if (assigneeFilter.value) {
    result = result.filter(r => r.issue.assignee === assigneeFilter.value);
  }
  if (priorityFilter.value) {
    result = result.filter(r => r.issue.priority === priorityFilter.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value;
    result = result.filter(r =>
      issueMatchesSearch(r.issue.summary, r.issue.key, r.programRef?.summary ?? null, q),
    );
  }

  return result.sort((a, b) => a.issue.summary.localeCompare(b.issue.summary, 'pl'));
});

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const activeFilterCount = computed(() => {
  let n = 0;
  if (searchQuery.value.trim()) n += 1;
  if (selectedProgramKey.value) n += 1;
  if (statusFilter.value || assigneeFilter.value || priorityFilter.value) n += 1;
  if (issueTypeFilter.value || progressFilter.value) n += 1;
  if (programLifecycleFilter.value !== 'active') n += 1;
  const defaultTeams = defaultTeamFilterForBoard(jiraStore.boardName, uniqueStatscoreTeams.value);
  const teamChanged =
    selectedTeams.value.length !== defaultTeams.length ||
    selectedTeams.value.some(t => !defaultTeams.includes(t)) ||
    defaultTeams.some(t => !selectedTeams.value.includes(t)) ||
    includeUnassignedTeams.value;
  if (teamChanged) n += 1;
  return n;
});

function clearFilters() {
  searchQuery.value = '';
  selectedProgramKey.value = null;
  statusFilter.value = '';
  assigneeFilter.value = '';
  priorityFilter.value = '';
  issueTypeFilter.value = '';
  progressFilter.value = '';
  programLifecycleFilter.value = 'active';
  applyDefaultTeamFilter();
}

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
