<template>
  <span class="group relative inline-flex items-center gap-1 cursor-help">
    {{ label }}
    <span class="material-symbols-outlined text-[13px] text-on-surface-variant/60">help</span>
    <span
      role="tooltip"
      class="pointer-events-none absolute z-50 left-0 bottom-full mb-1.5 w-max max-w-[260px] px-3 py-2 rounded-lg text-xs leading-relaxed font-normal normal-case tracking-normal text-on-surface bg-surface-container-highest border border-outline-variant shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 text-left"
    >
      {{ text }}
    </span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  text: string;
}>();
</script>
