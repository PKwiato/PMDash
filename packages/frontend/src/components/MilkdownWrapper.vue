<template>
  <MilkdownProvider>
    <MilkdownEditor
      :modelValue="modelValue"
      :readOnly="readOnly"
      @update:modelValue="$emit('update:modelValue', $event)"
      @uploadAttachment="forwardUpload"
    />
  </MilkdownProvider>
</template>

<script setup lang="ts">
import { MilkdownProvider } from '@milkdown/vue';
import MilkdownEditor from './MilkdownEditor.vue';

defineProps<{
  modelValue: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'uploadAttachment', file: File, resolve: (url: string) => void, reject: (err: unknown) => void): void;
}>();

function forwardUpload(file: File, resolve: (url: string) => void, reject: (err: unknown) => void) {
  emit('uploadAttachment', file, resolve, reject);
}
</script>
