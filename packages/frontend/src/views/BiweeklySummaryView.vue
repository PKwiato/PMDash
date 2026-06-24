<template>
  <div class="max-w-[1600px] mx-auto p-md lg:p-lg pb-44">
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-lg">
      <div>
        <h1 class="font-headline-xl text-2xl font-bold text-on-surface tracking-tight">Podsumowanie 2 tygodni</h1>
        <p class="font-body-sm text-on-surface-variant mt-1">
          Zespół: <strong class="text-on-surface">{{ teamLabel }}</strong>
          <span v-if="selectedTeams.length"> · STATSCORE Team: {{ selectedTeams.join(', ') }}</span>
        </p>
      </div>
      <div class="flex flex-wrap gap-2 items-end">
        <div class="flex flex-col">
          <label class="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Od</label>
          <input
            v-model="dateFrom"
            type="date"
            class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface"
          />
        </div>
        <div class="flex flex-col">
          <label class="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Do</label>
          <input
            v-model="dateTo"
            type="date"
            class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface"
          />
        </div>
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg text-body-sm font-bold hover:bg-secondary-fixed transition-colors disabled:opacity-50"
          :disabled="loading || changelogLoading"
          @click="refresh"
        >
          <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': loading || changelogLoading }">sync</span>
          Odśwież
        </button>
      </div>
    </div>

    <div
      v-if="!jiraStore.defaultBoardId"
      class="mb-lg px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm"
    >
      Ustaw domyślny board Jiry w Settings, aby zobaczyć podsumowanie zespołu.
    </div>

    <div v-if="loading && !workloadReady" class="py-20 text-center text-on-surface-variant">
      <span class="material-symbols-outlined animate-spin text-4xl">sync</span>
      <p class="mt-3 font-label-md">Ładowanie worklogów i danych Jiry…</p>
    </div>

    <template v-if="workloadReady">
      <!-- KPI -->
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-md mb-lg">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Dowiezione</p>
          <span v-if="changelogLoading" class="text-3xl font-bold text-on-surface-variant">…</span>
          <span v-else class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ kpis.deliveredCount }}</span>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">SP dowiezione</p>
          <span v-if="changelogLoading" class="text-3xl font-bold text-on-surface-variant">…</span>
          <span v-else class="text-3xl font-bold text-on-surface">{{ kpis.storyPointsDelivered || '—' }}</span>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Rozpoczęte</p>
          <span v-if="changelogLoading" class="text-3xl font-bold text-on-surface-variant">…</span>
          <span v-else class="text-3xl font-bold text-on-surface">{{ kpis.startedCount }}</span>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">W toku</p>
          <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ kpis.inFlightCount }}</span>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Powroty</p>
          <span v-if="changelogLoading" class="text-3xl font-bold text-on-surface-variant">…</span>
          <span v-else class="text-3xl font-bold text-amber-600 dark:text-amber-400">{{ kpis.returnsCount }}</span>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Godziny</p>
          <span class="text-3xl font-bold text-on-surface">{{ totalHours > 0 ? totalHours.toFixed(0) + 'h' : '—' }}</span>
        </div>
      </div>

      <p class="text-xs text-on-surface-variant mb-lg">
        Okres: {{ formatPeriodDate(dateFrom) }} – {{ formatPeriodDate(dateTo) }}
        · {{ activeTeamTasks.length }} tasków zespołu zaraportowanych w Clockwork
        <span v-if="clockworkKeysCount > activeTeamTasks.length" class="text-amber-600 dark:text-amber-400">
          · {{ clockworkKeysCount - activeTeamTasks.length }} poza zespołem / bez Jiry
        </span>
      </p>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-lg mb-lg">
        <!-- Delivered -->
        <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div class="px-lg py-md border-b border-outline-variant flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-on-surface">Dowiezione ({{ changelogLoading ? '…' : delivered.length }})</h2>
            <span v-if="changelogLoading" class="text-xs text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] animate-spin">sync</span>
              changelog
            </span>
          </div>
          <div v-if="changelogLoading" class="p-lg text-sm text-on-surface-variant italic">
            Ładowanie historii statusów…
          </div>
          <div v-else-if="delivered.length === 0" class="p-lg text-sm text-on-surface-variant italic">
            Brak przejść do Done w wybranym okresie (wymaga changelogu).
          </div>
          <div v-else class="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface-container-low sticky top-0">
                <tr>
                  <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Klucz</th>
                  <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Summary</th>
                  <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant text-center">SP</th>
                  <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Done</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr
                  v-for="row in delivered"
                  :key="row.issue.key"
                  class="hover:bg-surface-container/50 cursor-pointer"
                  @click="$router.push(`/tasks/${row.issue.key}`)"
                >
                  <td class="px-md py-2 font-bold text-secondary whitespace-nowrap">{{ row.issue.key }}</td>
                  <td class="px-md py-2 text-on-surface max-w-[200px]">
                    <div class="truncate">{{ row.issue.summary }}</div>
                    <span v-if="row.programKey" class="text-[10px] text-on-surface-variant">{{ row.programKey }}</span>
                  </td>
                  <td class="px-md py-2 text-center tabular-nums">{{ row.issue.storyPoints ?? '—' }}</td>
                  <td class="px-md py-2 text-on-surface-variant whitespace-nowrap text-xs">
                    {{ formatPeriodDate(row.completedAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- At risk -->
        <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div class="px-lg py-md border-b border-outline-variant flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-on-surface">W toku / ryzyko ({{ changelogLoading ? '…' : atRisk.length }})</h2>
            <span v-if="changelogLoading" class="text-xs text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] animate-spin">sync</span>
              changelog
            </span>
          </div>
          <div v-if="changelogLoading" class="p-lg text-sm text-on-surface-variant italic">
            Ładowanie historii statusów…
          </div>
          <div v-else-if="atRisk.length === 0" class="p-lg text-sm text-on-surface-variant italic">
            Brak tasków z blokadą, powrotami lub długą stagnacją.
          </div>
          <div v-else class="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface-container-low sticky top-0">
                <tr>
                  <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Klucz</th>
                  <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Summary</th>
                  <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Powód</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr
                  v-for="row in atRisk"
                  :key="row.issue.key"
                  class="hover:bg-surface-container/50 cursor-pointer"
                  @click="$router.push(`/tasks/${row.issue.key}`)"
                >
                  <td class="px-md py-2 font-bold text-secondary whitespace-nowrap">{{ row.issue.key }}</td>
                  <td class="px-md py-2 text-on-surface max-w-[200px] truncate">{{ row.issue.summary }}</td>
                  <td class="px-md py-2">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      :class="riskBadgeClass(row.reason)"
                    >
                      {{ row.detail }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- Team workload -->
      <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div class="px-lg py-md border-b border-outline-variant">
          <h2 class="text-lg font-bold text-on-surface">Praca zespołu (Clockwork)</h2>
          <p class="text-xs text-on-surface-variant mt-1">
            Źródło: Clockwork. Taski Jiry podpięte po kluczu; widoczne tylko zespołowe po joinie.
          </p>
        </div>

        <div v-if="clockworkStore.loading" class="p-lg text-center text-on-surface-variant text-sm">
          <span class="material-symbols-outlined animate-spin align-middle mr-2">sync</span>
          Ładowanie worklogów…
        </div>

        <div v-else-if="clockworkStore.error" class="p-lg text-sm text-amber-700 dark:text-amber-300">
          Clockwork niedostępny: {{ clockworkStore.error }}
        </div>

        <div v-else-if="personWorkloads.length === 0" class="p-lg text-sm text-on-surface-variant italic">
          Brak worklogów na taskach zespołu w tym okresie.
        </div>

        <div v-else class="divide-y divide-outline-variant">
          <div v-for="person in personWorkloads" :key="person.user.accountId">
            <button
              type="button"
              class="w-full px-lg py-md flex items-center gap-4 hover:bg-surface-container/40 transition-colors text-left"
              @click="togglePerson(person.user.accountId)"
            >
              <img
                v-if="person.user.avatarUrl"
                :src="person.user.avatarUrl"
                :alt="person.user.displayName"
                class="w-10 h-10 rounded-full border border-outline-variant shrink-0"
              />
              <div
                v-else
                class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold shrink-0"
              >
                {{ person.user.displayName.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-on-surface">{{ person.user.displayName }}</div>
                <div class="text-xs text-on-surface-variant">
                  {{ person.issues.length }} tasków
                  <span v-if="person.inconsistencyCount > 0" class="text-amber-600 dark:text-amber-400">
                    · {{ person.inconsistencyCount }} niespójności
                  </span>
                </div>
              </div>
              <div class="text-xl font-bold tabular-nums text-on-surface shrink-0">
                {{ formatHours(person.totalSeconds) }}
              </div>
              <span class="material-symbols-outlined text-on-surface-variant shrink-0">
                {{ expandedPeople.has(person.user.accountId) ? 'expand_less' : 'expand_more' }}
              </span>
            </button>

            <div
              v-if="expandedPeople.has(person.user.accountId)"
              class="px-lg pb-lg bg-surface-container-low/30"
            >
              <div class="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
                <table class="w-full text-left text-sm">
                  <thead class="bg-surface-container-low">
                    <tr>
                      <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Klucz</th>
                      <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Summary</th>
                      <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant">Status</th>
                      <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant text-right">Godziny</th>
                      <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant text-right">%</th>
                      <th class="px-md py-2 text-[10px] font-bold uppercase text-on-surface-variant text-center">Wpisy</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant">
                    <tr
                      v-for="row in person.issues"
                      :key="row.issueKey"
                      class="hover:bg-surface-container/50 cursor-pointer"
                      @click="$router.push(`/tasks/${row.issueKey}`)"
                    >
                      <td class="px-md py-2 font-bold text-secondary whitespace-nowrap">{{ row.issueKey }}</td>
                      <td class="px-md py-2 text-on-surface max-w-[220px]">
                        <div class="truncate">{{ row.summary }}</div>
                        <div class="flex flex-wrap gap-1 mt-0.5">
                          <span v-if="row.programKey" class="text-[10px] text-on-surface-variant">{{ row.programKey }}</span>
                          <span
                            v-if="!row.jiraLinked"
                            class="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400"
                          >brak w Jirze</span>
                          <span
                            v-else-if="row.isAssignee"
                            class="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400"
                          >assignee</span>
                        </div>
                      </td>
                      <td class="px-md py-2 text-xs text-on-surface-variant whitespace-nowrap">{{ row.status }}</td>
                      <td class="px-md py-2 text-right tabular-nums font-medium">{{ formatHours(row.seconds) }}</td>
                      <td class="px-md py-2 text-right tabular-nums text-on-surface-variant">{{ row.percentOfUser }}%</td>
                      <td class="px-md py-2 text-center tabular-nums text-on-surface-variant">{{ row.logCount }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Fixed diagnostics — always visible after load attempt -->
    <div
      v-if="loadAttempted"
      class="fixed bottom-0 left-0 right-0 md:left-60 z-30 border-t-2 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] text-sm"
      :class="clockworkStore.error
        ? 'bg-error-container border-error text-on-error-container'
        : 'bg-surface-container-highest border-secondary/60 text-on-surface-variant'"
    >
      <div class="max-w-[1600px] mx-auto px-md lg:px-lg py-3">
        <div class="flex items-start gap-2 mb-1">
          <span class="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">troubleshoot</span>
          <div class="font-bold text-on-surface">Diagnostyka przepływu danych</div>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 pl-7">
          <span>CW użytkownicy: <strong class="text-on-surface">{{ diagnostics.clockworkUsers }}</strong></span>
          <span>CW klucze: <strong class="text-on-surface">{{ diagnostics.clockworkKeys }}</strong></span>
          <span>CW godziny: <strong class="text-on-surface">{{ diagnostics.totalClockworkHours.toFixed(1) }}h</strong></span>
          <span>Jira join: <strong class="text-on-surface">{{ diagnostics.jiraLinked }}</strong></span>
          <span>zespół: <strong class="text-on-surface">{{ diagnostics.teamMatched }}</strong></span>
          <span v-if="diagnostics.filteredOut > 0" class="text-amber-600 dark:text-amber-400">
            odfiltrowane: <strong>{{ diagnostics.filteredOut }}</strong>
          </span>
        </div>
        <p v-if="clockworkStore.error" class="mt-2 pl-7 text-error font-medium">
          Clockwork: {{ clockworkStore.error }}
        </p>
        <p v-else-if="!workloadReady && loading" class="mt-2 pl-7 text-on-surface-variant">
          Odświeżanie danych…
        </p>
        <p v-else-if="changelogLoading" class="mt-2 pl-7 text-on-surface-variant">
          Worklogi gotowe — ładuję changelog dla sekcji Dowiezione / Ryzyko…
        </p>
      <p v-else-if="diagnostics.clockworkKeys === 0 && diagnostics.totalClockworkHours === 0" class="mt-2 pl-7 text-amber-600 dark:text-amber-400">
        Brak worklogów członków boardu w tym okresie — sprawdź daty lub filtr użytkowników Jiry.
      </p>
      <p v-else-if="diagnostics.clockworkKeys === 0" class="mt-2 pl-7 text-amber-600 dark:text-amber-400">
        Clockwork ma godziny, ale brak kluczy issue — backend powinien mapować issueId → key (odśwież po restarcie backendu).
      </p>
        <p v-else-if="diagnostics.jiraLinked === 0" class="mt-2 pl-7 text-amber-600 dark:text-amber-400">
          Clockwork ma klucze, ale żaden nie został pobrany z Jiry — sprawdź Network → POST /api/jira/issues/bulk.
        </p>
        <p v-else-if="diagnostics.teamMatched === 0" class="mt-2 pl-7 text-amber-600 dark:text-amber-400">
          Jira połączona, ale filtr STATSCORE Team odrzucił wszystkie taski.
        </p>
        <p class="mt-1 pl-7 text-xs">
          Filtr zespołu:
          <strong class="text-on-surface">{{ selectedTeams.length ? selectedTeams.join(', ') : '(wyłączony — brak mapowania boardu)' }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useJiraStore } from '../stores/jiraStore';
import { useClockworkStore } from '../stores/clockworkStore';
import {
  defaultBiweeklyRange,
  formatPeriodDate,
  collectClockworkIssueKeys,
  collectRelatedProgramKeysForIssues,
  missingIssueKeys,
  activeTeamTasksFromClockwork,
  completedTasksInPeriod,
  atRiskTasks,
  computeBiweeklyKpis,
  computeBiweeklyDiagnostics,
  buildPersonWorkloads,
  totalTeamWorklogSeconds,
  teamFilterFromLoadedIssues,
  type CompletedTaskRow,
  type AtRiskTaskRow,
} from '../utils/biweeklySummary';

const jiraStore = useJiraStore();
const clockworkStore = useClockworkStore();

const range = defaultBiweeklyRange();
const dateFrom = ref(range.from);
const dateTo = ref(range.to);
const loading = ref(false);
const workloadReady = ref(false);
const changelogReady = ref(false);
const changelogLoading = ref(false);
const loadAttempted = ref(false);
const expandedPeople = ref(new Set<string>());

const teamLabel = computed(() => jiraStore.boardName || '—');
const selectedTeams = computed(() =>
  teamFilterFromLoadedIssues(jiraStore.boardName, jiraStore.issues),
);

const activeTeamTasks = computed(() =>
  activeTeamTasksFromClockwork(clockworkStore.analysis, jiraStore.issues, selectedTeams.value),
);

const clockworkKeysCount = computed(() => collectClockworkIssueKeys(clockworkStore.analysis).length);

const diagnostics = computed(() =>
  computeBiweeklyDiagnostics(clockworkStore.analysis, jiraStore.issues, selectedTeams.value),
);

const delivered = computed<CompletedTaskRow[]>(() => {
  if (!changelogReady.value) return [];
  return completedTasksInPeriod(activeTeamTasks.value, jiraStore.issues, dateFrom.value, dateTo.value);
});

const atRisk = computed<AtRiskTaskRow[]>(() => {
  if (!changelogReady.value) return [];
  return atRiskTasks(activeTeamTasks.value, jiraStore.issues, dateFrom.value, dateTo.value);
});

const kpis = computed(() =>
  computeBiweeklyKpis(activeTeamTasks.value, delivered.value, atRisk.value, dateFrom.value, dateTo.value),
);

const personWorkloads = computed(() =>
  buildPersonWorkloads(clockworkStore.analysis, jiraStore.issues, selectedTeams.value),
);

const totalHours = computed(() => totalTeamWorklogSeconds(personWorkloads.value) / 3600);

function formatHours(seconds: number): string {
  return `${(seconds / 3600).toFixed(1)}h`;
}

function togglePerson(accountId: string) {
  if (expandedPeople.value.has(accountId)) {
    expandedPeople.value.delete(accountId);
  } else {
    expandedPeople.value.add(accountId);
  }
}

function riskBadgeClass(reason: AtRiskTaskRow['reason']) {
  if (reason === 'blocked') return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
  if (reason === 'returns') return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  return 'bg-surface-container-high text-on-surface-variant';
}

async function hydrateJiraFromClockwork(cwKeys: readonly string[]): Promise<void> {
  if (cwKeys.length === 0) return;

  const keysToFetch = missingIssueKeys(cwKeys, jiraStore.issues);
  if (keysToFetch.length > 0) {
    await jiraStore.fetchIssuesByKeys(keysToFetch, { includeChangelog: false });
  }

  const linked = cwKeys
    .map(k => jiraStore.issues.find(i => i.key.toUpperCase() === k.toUpperCase()))
    .filter((i): i is NonNullable<typeof i> => i != null);
  const programKeys = collectRelatedProgramKeysForIssues(linked);
  const parentsToFetch = missingIssueKeys(programKeys, jiraStore.issues);
  if (parentsToFetch.length > 0) {
    await jiraStore.fetchIssuesByKeys(parentsToFetch, { includeChangelog: false });
  }
}

function issueNeedsChangelog(key: string): boolean {
  const issue = jiraStore.issues.find(i => i.key.toUpperCase() === key.toUpperCase());
  return issue != null && issue.changelog === undefined;
}

async function loadChangelogForTeamTasks(): Promise<void> {
  const teamsFilter = teamFilterFromLoadedIssues(jiraStore.boardName, jiraStore.issues);
  const active = activeTeamTasksFromClockwork(
    clockworkStore.analysis,
    jiraStore.issues,
    teamsFilter,
  );
  const needsChangelog = active.map(t => t.key).filter(issueNeedsChangelog);
  if (needsChangelog.length === 0) {
    changelogReady.value = true;
    return;
  }

  changelogLoading.value = true;
  try {
    await jiraStore.fetchIssuesByKeys(needsChangelog, { includeChangelog: true });
    changelogReady.value = true;
  } catch (err: unknown) {
    console.error('Changelog load failed:', err);
    changelogReady.value = true;
  } finally {
    changelogLoading.value = false;
  }
}

async function refresh() {
  const boardId = jiraStore.defaultBoardId;
  loadAttempted.value = true;
  if (!boardId) return;

  loading.value = true;
  workloadReady.value = false;
  changelogReady.value = false;
  changelogLoading.value = false;

  try {
    await clockworkStore.fetchAnalysis(boardId, dateFrom.value, dateTo.value);

    const cwKeys = collectClockworkIssueKeys(clockworkStore.analysis);
    await hydrateJiraFromClockwork(cwKeys);

    workloadReady.value = true;
    loading.value = false;

    await loadChangelogForTeamTasks();
  } catch (err: unknown) {
    console.error('Team summary refresh failed:', err);
    workloadReady.value = true;
    changelogReady.value = true;
  } finally {
    loading.value = false;
    changelogLoading.value = false;
  }
}

onMounted(async () => {
  if (!jiraStore.defaultBoardId) {
    await jiraStore.fetchConfig();
  }
  if (jiraStore.defaultBoardId) {
    await refresh();
  } else {
    loadAttempted.value = true;
  }
});
</script>
