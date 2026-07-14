<template>
  <span
    ref="triggerRef"
    class="inline-flex items-center gap-1 cursor-help"
    tabindex="0"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
  >
    {{ label }}
    <span class="material-symbols-outlined text-[13px] text-on-surface-variant/60">help</span>
  </span>

  <Teleport to="body">
    <div
      v-if="visible"
      role="tooltip"
      class="pointer-events-none fixed z-[9999] w-max max-w-[260px] px-3 py-2 rounded-lg text-xs leading-relaxed font-normal normal-case tracking-normal text-on-surface bg-surface-container-highest border border-outline-variant shadow-lg text-left -translate-x-1/2 -translate-y-[calc(100%+6px)]"
      :style="{ top: `${top}px`, left: `${left}px` }"
    >
      {{ text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFixedTooltip } from '../composables/useFixedTooltip';

defineProps<{
  label: string;
  text: string;
}>();

const triggerRef = ref<HTMLElement | null>(null);
const { visible, top, left, show, hide } = useFixedTooltip(triggerRef);
</script>
