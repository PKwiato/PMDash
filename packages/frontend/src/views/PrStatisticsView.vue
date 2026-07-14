<template>
  <div class="max-w-[1600px] mx-auto p-md lg:p-lg">
    <div class="flex flex-wrap justify-between items-end gap-4 mb-lg">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-on-surface">PR Health</h1>
        <p class="font-body-md text-body-md text-on-primary-container mt-xs">
          statscore/marketplace — operacyjny przegląd Pull Requestów
        </p>
      </div>

      <div class="flex flex-wrap gap-sm items-end">
        <div class="flex flex-col">
          <label class="text-[10px] font-bold uppercase text-on-primary-container mb-1">Zakres dat</label>
          <div class="flex gap-2">
            <input
              v-model="dateFrom"
              type="date"
              class="bg-surface-container border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-secondary transition-all text-on-surface"
            />
            <input
              v-model="dateTo"
              type="date"
              class="bg-surface-container border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-secondary transition-all text-on-surface"
            />
          </div>
        </div>

        <button
          class="px-md py-sm h-[38px] bg-secondary text-on-secondary rounded-lg text-body-md font-bold hover:bg-secondary-fixed transition-colors flex items-center gap-sm disabled:opacity-50"
          :disabled="githubStore.loading"
          @click="refresh"
        >
          <span class="material-symbols-outlined text-md" :class="{ 'animate-spin': githubStore.loading }">sync</span>
          Odśwież
        </button>
      </div>
    </div>

    <div v-if="githubStore.loading && !githubStore.stats" class="p-xl text-center">
      <span class="material-symbols-outlined text-4xl animate-spin text-secondary">sync</span>
      <p class="text-on-surface-variant mt-4">Pobieranie statystyk PR z GitHub...</p>
    </div>

    <div v-else-if="githubStore.error" class="p-xl text-center">
      <div class="bg-error-container/20 border border-error/20 p-lg rounded-xl inline-block max-w-md">
        <span class="material-symbols-outlined text-error text-3xl mb-2">error</span>
        <p class="text-on-error-container font-bold mb-1">Błąd pobierania danych</p>
        <p class="text-on-error-container text-sm">{{ githubStore.error }}</p>
        <p v-if="githubStore.error.includes('not configured')" class="text-on-error-container text-xs mt-2">
          Dodaj token GitHub do <code class="bg-surface-container px-1 rounded">data/config.json</code>
        </p>
        <button class="mt-4 px-4 py-2 bg-error text-white rounded-lg text-xs font-bold" @click="refresh">
          Spróbuj ponownie
        </button>
      </div>
    </div>

    <template v-else-if="githubStore.stats">
      <!-- Health KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-md mb-lg">
        <HoverTooltip
          text="Mediana czasu od otwarcia do merge dla PR zmergowanych w okresie. Połowa PR-ów merge'uje się szybciej niż ta wartość. Zielony: ≤1.8d, żółty: ≤3d, czerwony: >3d."
          wrapper-class="xl:col-span-1"
        >
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full cursor-help">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">p50 merge</p>
            <span class="text-2xl font-bold tabular-nums" :class="mergeDaysClass(githubStore.stats.health.p50MergeDays)">
              {{ githubStore.stats.health.p50MergeDays }}d
            </span>
          </div>
        </HoverTooltip>
        <HoverTooltip
          text="90. percentyl czasu do merge — tylko 10% PR-ów trwa dłużej. Powyżej 5 dni oznacza problem z przepływem pracy. Zielony: ≤3d, żółty: ≤5d, czerwony: >5d."
          wrapper-class="xl:col-span-1"
        >
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full cursor-help">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">p90 merge</p>
            <span class="text-2xl font-bold tabular-nums" :class="mergeDaysClass(githubStore.stats.health.p90MergeDays, true)">
              {{ githubStore.stats.health.p90MergeDays }}d
            </span>
          </div>
        </HoverTooltip>
        <HoverTooltip
          :text="`Liczba PR zmergowanych w okresie ${githubStore.stats.period.from} – ${githubStore.stats.period.to}. Δ% porównuje z poprzednim okresem (${githubStore.stats.previousPeriod.from} – ${githubStore.stats.previousPeriod.to}).`"
          wrapper-class="xl:col-span-1"
        >
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full cursor-help">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Merged</p>
            <span class="text-2xl font-bold text-secondary tabular-nums">{{ githubStore.stats.health.mergedCount }}</span>
            <p v-if="githubStore.stats.health.mergedDeltaPercent !== null" class="text-[10px] mt-0.5 tabular-nums" :class="deltaClass(githubStore.stats.health.mergedDeltaPercent)">
              {{ formatDelta(githubStore.stats.health.mergedDeltaPercent) }} vs poprz. okres
            </p>
          </div>
        </HoverTooltip>
        <HoverTooltip
          text="Aktualna liczba otwartych PR w repozytorium. Wysoki backlog może oznaczać wąskie gardło w review lub merge."
          wrapper-class="xl:col-span-1"
        >
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full cursor-help">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Open backlog</p>
            <span class="text-2xl font-bold text-on-surface tabular-nums">{{ githubStore.stats.health.openBacklog }}</span>
          </div>
        </HoverTooltip>
        <HoverTooltip
          text="Otwarte PR starsze niż 3 dni. Przeterminowane PR często czekają na review, decyzję lub rozwiązanie konfliktów."
          wrapper-class="xl:col-span-1"
        >
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full cursor-help">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Stale (&gt;3d)</p>
            <span class="text-2xl font-bold tabular-nums" :class="githubStore.stats.health.staleCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface'">
              {{ githubStore.stats.health.staleCount }}
            </span>
          </div>
        </HoverTooltip>
        <HoverTooltip
          text="Odsetek zmergowanych PR, które miały co najmniej jednego reviewera. Niski wskaźnik sugeruje pomijanie code review. Cel: ≥80%."
          wrapper-class="xl:col-span-1"
        >
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full cursor-help">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Review coverage</p>
            <span class="text-2xl font-bold tabular-nums" :class="coverageClass(githubStore.stats.health.reviewCoveragePercent)">
              {{ githubStore.stats.health.reviewCoveragePercent }}%
            </span>
          </div>
        </HoverTooltip>
        <HoverTooltip
          text="Odsetek zmergowanych PR większych niż 500 linii (additions + deletions). Duże PR są trudniejsze w review i zwiększają ryzyko regresji. Cel: <30%."
          wrapper-class="xl:col-span-2"
        >
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full cursor-help">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Large PRs (&gt;500 linii)</p>
            <span class="text-2xl font-bold tabular-nums" :class="githubStore.stats.health.largePrPercent > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface'">
              {{ githubStore.stats.health.largePrPercent }}%
            </span>
            <p class="text-[10px] text-on-surface-variant mt-0.5">udział w zmergowanych PR w okresie</p>
          </div>
        </HoverTooltip>
      </div>

      <!-- Needs attention -->
      <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-lg">
        <div class="px-lg py-md border-b border-outline-variant flex items-center justify-between gap-2">
          <HoverTooltip text="Otwarte PR spełniające kryteria alertu: brak review, przeterminowane (>3 dni) lub zbyt duże (>500 linii). Posortowane wg priorytetu problemu.">
            <h2 class="text-lg font-bold text-on-surface flex items-center gap-2 cursor-help">
              <span class="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
              PR wymagające uwagi ({{ githubStore.stats.needsAttention.length }})
            </h2>
          </HoverTooltip>
        </div>

        <div v-if="githubStore.stats.needsAttention.length === 0" class="p-lg text-center text-on-surface-variant text-sm">
          Brak otwartych PR spełniających kryteria alertu.
        </div>

        <div v-else class="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-surface-container-low sticky top-0">
              <tr>
                <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                  <TooltipLabel label="PR" text="Numer i tytuł Pull Requesta. Kliknij numer, aby otworzyć na GitHubie." />
                </th>
                <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                  <TooltipLabel label="Autor" text="Osoba, która utworzyła PR." />
                </th>
                <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                  <TooltipLabel label="Dni otwarte" text="Liczba dni od utworzenia PR do teraz. Wartości >3 dni są podświetlane na żółto." />
                </th>
                <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                  <TooltipLabel label="Linie" text="Suma dodanych i usuniętych linii (additions + deletions). Wartości >500 są podświetlane." />
                </th>
                <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                  <TooltipLabel label="Reviewerzy" text="Osoby, które zostawiły review na tym PR. Brak oznacza, że PR nie był jeszcze reviewowany." />
                </th>
                <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                  <TooltipLabel label="Problem" text="Główny powód, dla którego PR wymaga uwagi. Najwyższy priorytet: stale bez review." />
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr
                v-for="pr in githubStore.stats.needsAttention"
                :key="pr.number"
                class="hover:bg-surface-container/50 transition-colors"
              >
                <td class="px-lg py-md">
                  <a
                    :href="prUrl(pr.number)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-bold text-secondary hover:underline"
                  >
                    #{{ pr.number }}
                  </a>
                  <div class="text-xs text-on-surface-variant line-clamp-1 max-w-[280px]">{{ pr.title }}</div>
                </td>
                <td class="px-lg py-md">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="pr.authorAvatarUrl"
                      :src="pr.authorAvatarUrl"
                      :alt="pr.author"
                      class="w-6 h-6 rounded-full border border-outline-variant"
                    />
                    <span class="text-on-surface">@{{ pr.author }}</span>
                  </div>
                </td>
                <td class="px-lg py-md tabular-nums" :class="pr.daysOpen > 3 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''">
                  {{ pr.daysOpen }}
                </td>
                <td class="px-lg py-md tabular-nums" :class="pr.linesChanged > 500 ? 'text-amber-600 dark:text-amber-400' : ''">
                  {{ pr.linesChanged }}
                </td>
                <td class="px-lg py-md text-on-surface-variant text-xs">
                  {{ pr.reviewers.length ? pr.reviewers.map(r => '@' + r).join(', ') : '—' }}
                </td>
                <td class="px-lg py-md">
                  <HoverTooltip :text="reasonTooltip(pr.reason)">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-help" :class="reasonBadgeClass(pr.reason)">
                      {{ reasonLabel(pr.reason) }}
                    </span>
                  </HoverTooltip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Team tables -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-lg">
        <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div class="px-lg py-md border-b border-outline-variant">
            <HoverTooltip text="Statystyki per autor w wybranym okresie: ile PR otworzył, zmergował, jaki ma udział w throughput zespołu i średnie metryki jakości.">
              <h2 class="text-lg font-bold text-on-surface cursor-help">Aktywność autorów</h2>
            </HoverTooltip>
          </div>
          <div v-if="githubStore.stats.authorActivity.length === 0" class="p-lg text-center text-on-surface-variant text-sm">
            Brak aktywności autorów w okresie.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface-container-low">
                <tr>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Autor" text="Login GitHub autora PR." />
                  </th>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Otwarte" text="Liczba PR utworzonych przez autora w wybranym okresie." />
                  </th>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Merged" text="Liczba PR zmergowanych przez autora w wybranym okresie." />
                  </th>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Udział" text="Procentowy udział autora w łącznej liczbie merge w okresie." />
                  </th>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Śr. merge" text="Średni czas od otwarcia do merge dla PR zmergowanych przez tego autora." />
                  </th>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Śr. rozmiar" text="Średnia liczba zmienionych linii (additions + deletions) w zmergowanych PR autora." />
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr v-for="author in githubStore.stats.authorActivity" :key="author.login" class="hover:bg-surface-container/50">
                  <td class="px-lg py-md">
                    <div class="flex items-center gap-2">
                      <img
                        v-if="author.avatarUrl"
                        :src="author.avatarUrl"
                        :alt="author.login"
                        class="w-6 h-6 rounded-full border border-outline-variant"
                      />
                      <span class="font-medium text-on-surface">@{{ author.login }}</span>
                    </div>
                  </td>
                  <td class="px-lg py-md tabular-nums">{{ author.opened }}</td>
                  <td class="px-lg py-md tabular-nums font-bold text-secondary">{{ author.merged }}</td>
                  <td class="px-lg py-md tabular-nums">{{ author.sharePercent }}%</td>
                  <td class="px-lg py-md tabular-nums">{{ author.avgMergeDays }}d</td>
                  <td class="px-lg py-md tabular-nums">{{ author.avgSize }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div class="px-lg py-md border-b border-outline-variant">
            <HoverTooltip text="Kto reviewuje PR w zespole. Pomaga wykryć nierównomierny rozkład obowiązków review — np. gdy jedna osoba robi większość review.">
              <h2 class="text-lg font-bold text-on-surface cursor-help">Udział w review</h2>
            </HoverTooltip>
          </div>
          <div v-if="githubStore.stats.reviewerActivity.length === 0" class="p-lg text-center text-on-surface-variant text-sm">
            Brak review w okresie.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface-container-low">
                <tr>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Reviewer" text="Login GitHub osoby, która zostawiła review." />
                  </th>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Review" text="Liczba PR, na których reviewer zostawił przynajmniej jedno review w okresie." />
                  </th>
                  <th class="px-lg py-md text-[10px] font-bold uppercase text-on-surface-variant">
                    <TooltipLabel label="Unikalne PR" text="Liczba unikalnych PR z review od tej osoby. Równa liczbie review, bo każdy PR liczony jest raz." />
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr v-for="reviewer in githubStore.stats.reviewerActivity" :key="reviewer.login" class="hover:bg-surface-container/50">
                  <td class="px-lg py-md font-medium text-on-surface">@{{ reviewer.login }}</td>
                  <td class="px-lg py-md tabular-nums font-bold text-secondary">{{ reviewer.reviewCount }}</td>
                  <td class="px-lg py-md tabular-nums">{{ reviewer.uniquePrs }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>

    <div v-else-if="loadAttempted" class="p-xl text-center text-on-surface-variant">
      Brak danych. Kliknij „Odśwież", aby pobrać statystyki.
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import HoverTooltip from '../components/HoverTooltip.vue';
import TooltipLabel from '../components/TooltipLabel.vue';
import type { PrAttentionReason } from '../types/api';
import { useGithubStore } from '../stores/githubStore';

const githubStore = useGithubStore();
const loadAttempted = ref(false);

const REPO_OWNER = 'statscore';
const REPO_NAME = 'marketplace';

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return formatDate(d);
}

const dateFrom = ref(daysAgo(6));
const dateTo = ref(formatDate(new Date()));

async function refresh() {
  loadAttempted.value = true;
  await githubStore.fetchPrStats(dateFrom.value, dateTo.value);
}

function prUrl(number: number): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/pull/${number}`;
}

function mergeDaysClass(days: number, isP90 = false): string {
  const threshold = isP90 ? 5 : 3;
  if (days > threshold) return 'text-error';
  if (days > threshold * 0.6) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function coverageClass(percent: number): string {
  if (percent >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (percent >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-error';
}

function deltaClass(delta: number): string {
  if (delta > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (delta < 0) return 'text-error';
  return 'text-on-surface-variant';
}

function formatDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta}%`;
}

function reasonLabel(reason: PrAttentionReason): string {
  const labels: Record<PrAttentionReason, string> = {
    stale_no_review: 'Stale bez review',
    no_review: 'Bez review',
    stale: 'Stale',
    large: 'Duży PR',
  };
  return labels[reason];
}

function reasonTooltip(reason: PrAttentionReason): string {
  const tooltips: Record<PrAttentionReason, string> = {
    stale_no_review: 'PR otwarty ponad 3 dni i bez żadnego review — najwyższy priorytet, wymaga natychmiastowej uwagi.',
    no_review: 'PR bez review — nikt jeszcze nie przejrzał zmian. Przypisz reviewera.',
    stale: 'PR otwarty ponad 3 dni — może blokować pipeline lub czekać na decyzję.',
    large: 'PR większy niż 500 linii — rozważ podział na mniejsze części, łatwiejsze w review.',
  };
  return tooltips[reason];
}

function reasonBadgeClass(reason: PrAttentionReason): string {
  const classes: Record<PrAttentionReason, string> = {
    stale_no_review: 'bg-error/15 text-error',
    no_review: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    stale: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    large: 'bg-secondary-container/30 text-secondary',
  };
  return classes[reason];
}

onMounted(() => {
  refresh();
});
</script>
