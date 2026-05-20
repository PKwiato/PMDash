<template>
  <span
    v-if="cssColor"
    class="inline-block shrink-0 rounded-sm"
    :class="sizeClass"
    :style="{ backgroundColor: cssColor }"
    :title="title"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { jiraEpicColorToCss } from '../utils/jiraEpicColors';

const props = withDefaults(
  defineProps<{
    color?: string | null;
    title?: string;
    size?: 'sm' | 'md';
  }>(),
  { size: 'sm' },
);

const cssColor = computed(() => jiraEpicColorToCss(props.color));

const sizeClass = computed(() =>
  props.size === 'md' ? 'w-3 h-3 rounded' : 'w-2 h-2 rounded-sm',
);
</script>
