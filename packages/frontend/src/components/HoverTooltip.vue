<template>
  <div
    ref="triggerRef"
    :class="[inline ? 'inline-block' : 'block w-full', wrapperClass]"
    @mouseenter="show"
    @mouseleave="hide"
  >
    <slot />
  </div>

  <Teleport to="body">
    <div
      v-if="visible && text"
      role="tooltip"
      class="pointer-events-none fixed z-[9999] w-max max-w-[280px] px-3 py-2 rounded-lg text-xs leading-relaxed text-on-surface bg-surface-container-highest border border-outline-variant shadow-lg text-left -translate-x-1/2 -translate-y-[calc(100%+6px)]"
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
  text: string;
  wrapperClass?: string;
  inline?: boolean;
}>();

const triggerRef = ref<HTMLElement | null>(null);
const { visible, top, left, show, hide } = useFixedTooltip(triggerRef);
</script>
