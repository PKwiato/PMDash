<template>
  <div class="flex flex-col lg:flex-row gap-lg items-start">
    <div
      class="relative shrink-0 mx-auto lg:mx-0"
      @mouseleave="hoveredIndex = null"
    >
      <svg
        viewBox="0 0 220 220"
        class="w-[min(100%,280px)] h-auto"
        role="img"
        :aria-label="`Wykres kołowy: ${tasks.length} tasków, łącznie ${formatWorklogHours(totalSeconds)}`"
      >
        <g transform="translate(110, 110)">
          <path
            v-for="(slice, index) in slices"
            :key="slice.issueKey"
            :d="slice.path"
            :fill="slice.color"
            :stroke="'var(--color-surface-container-lowest, #fff)'"
            stroke-width="1.5"
            class="cursor-pointer transition-opacity duration-150"
            :opacity="hoveredIndex === null || hoveredIndex === index ? 1 : 0.4"
            @mouseenter="hoveredIndex = index"
            @click="emit('select', slice.issueKey)"
          />
        </g>
        <text
          x="110"
          y="104"
          text-anchor="middle"
          class="fill-on-surface text-[11px] font-bold"
        >
          {{ tasks.length }}
        </text>
        <text
          x="110"
          y="120"
          text-anchor="middle"
          class="fill-on-surface-variant text-[9px]"
        >
          tasków
        </text>
      </svg>
    </div>

    <div class="flex-1 min-w-0 w-full">
      <div
        v-if="activeSlice"
        class="mb-md p-md rounded-lg border border-outline-variant bg-surface-container-low/50"
      >
        <div class="font-bold text-secondary text-sm">{{ activeSlice.issueKey }}</div>
        <div class="text-sm text-on-surface mt-0.5 line-clamp-2">{{ activeSlice.summary }}</div>
        <div class="text-xs text-on-surface-variant mt-2">
          Łącznie:
          <strong class="text-on-surface tabular-nums">{{ formatWorklogHours(activeSlice.totalSeconds) }}</strong>
          <span class="mx-1">·</span>
          <strong class="text-on-surface tabular-nums">{{ activeSlice.percentOfTeam }}%</strong>
          zespołu
        </div>
        <ul class="mt-3 space-y-1.5">
          <li
            v-for="person in activeSlice.contributors"
            :key="person.accountId"
            class="flex items-center justify-between gap-2 text-sm"
          >
            <span class="flex items-center gap-2 min-w-0">
              <img
                v-if="person.avatarUrl"
                :src="person.avatarUrl"
                :alt="person.displayName"
                class="w-5 h-5 rounded-full border border-outline-variant shrink-0"
              />
              <span
                v-else
                class="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold shrink-0"
              >
                {{ person.displayName.charAt(0) }}
              </span>
              <span class="truncate text-on-surface">{{ person.displayName }}</span>
            </span>
            <span class="tabular-nums font-medium text-on-surface shrink-0">
              {{ formatWorklogHours(person.seconds) }}
            </span>
          </li>
        </ul>
      </div>

      <p v-else class="mb-md text-sm text-on-surface-variant italic">
        Najedź na wycinek wykresu, aby zobaczyć rozbicie godzin.
      </p>

      <div class="max-h-[220px] overflow-y-auto pr-1 space-y-1">
        <button
          v-for="(slice, index) in slices"
          :key="slice.issueKey"
          type="button"
          class="w-full flex items-center gap-2 px-2 py-1 rounded-md text-left text-xs hover:bg-surface-container/60 transition-colors"
          :class="hoveredIndex === index ? 'bg-surface-container/60' : ''"
          @mouseenter="hoveredIndex = index"
          @click="emit('select', slice.issueKey)"
        >
          <span
            class="w-2.5 h-2.5 rounded-sm shrink-0"
            :style="{ backgroundColor: slice.color }"
          />
          <span class="font-bold text-secondary shrink-0">{{ slice.issueKey }}</span>
          <span class="truncate text-on-surface-variant flex-1">{{ slice.summary }}</span>
          <span class="tabular-nums text-on-surface shrink-0">{{ formatWorklogHours(slice.totalSeconds) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatWorklogHours, type TaskWorkloadRow } from '../utils/biweeklySummary';

const props = defineProps<{
  tasks: readonly TaskWorkloadRow[];
}>();

const emit = defineEmits<{
  select: [issueKey: string];
}>();

const hoveredIndex = ref<number | null>(null);

const totalSeconds = computed(() =>
  props.tasks.reduce((sum, task) => sum + task.totalSeconds, 0),
);

interface PieSlice extends TaskWorkloadRow {
  path: string;
  color: string;
}

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#eab308', '#0ea5e9', '#d946ef',
];

function polarToCartesian(radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: radius * Math.cos(angleRad),
    y: radius * Math.sin(angleRad),
  };
}

function describeSlice(radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(radius, endAngle);
  const end = polarToCartesian(radius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 0 0 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

const slices = computed<PieSlice[]>(() => {
  const total = totalSeconds.value;
  if (total <= 0 || props.tasks.length === 0) return [];

  const radius = 96;
  let cursor = 0;

  return props.tasks.map((task, index) => {
    const sweep = (task.totalSeconds / total) * 360;
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    cursor = endAngle;

    return {
      ...task,
      path: describeSlice(radius, startAngle, endAngle),
      color: CHART_COLORS[index % CHART_COLORS.length]!,
    };
  });
});

const activeSlice = computed(() => {
  if (hoveredIndex.value == null) return null;
  return slices.value[hoveredIndex.value] ?? null;
});
</script>
