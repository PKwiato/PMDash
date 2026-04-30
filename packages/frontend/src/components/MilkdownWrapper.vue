<template>
  <MilkdownProvider>
    <MilkdownEditor 
      :modelValue="modelValue" 
      :noteId="noteId" 
      :readOnly="readOnly" 
      @update:modelValue="$emit('update:modelValue', $event)" 
      @uploadAttachment="onUploadAttachment" 
    />
  </MilkdownProvider>
</template>

<script setup lang="ts">
import { MilkdownProvider } from '@milkdown/vue';
import MilkdownEditor from './MilkdownEditor.vue';

const props = defineProps<{
  modelValue: string;
  noteId: string | null;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'uploadAttachment', file: File, resolve: (url: string) => void, reject: (err: any) => void): void;
}>();

async function onUploadAttachment(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    emit('uploadAttachment', file, resolve, reject);
  });
}
</script>
