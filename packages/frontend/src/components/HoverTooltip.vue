<template>
  <div class="group relative block w-full" :class="wrapperClass">
    <slot />
    <div
      v-if="text"
      role="tooltip"
      class="pointer-events-none absolute z-50 left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] w-max max-w-[280px] px-3 py-2 rounded-lg text-xs leading-relaxed text-on-surface bg-surface-container-highest border border-outline-variant shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 text-left"
    >
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
  wrapperClass?: string;
}>();
</script>
