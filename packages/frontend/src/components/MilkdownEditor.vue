<template>
  <div class="milkdown-editor-wrapper">
    <div ref="editorRef" class="crepe-root"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Crepe } from '@milkdown/crepe';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { replaceAll } from '@milkdown/utils';

// Crepe Themes
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

const props = defineProps<{
  modelValue: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editorRef = ref<HTMLDivElement | null>(null);
let crepe: Crepe | null = null;
let isInternalUpdate = false;

// Custom uploader implementation for Crepe
const uploader = async (file: File) => {
  try {
    // We use a custom event or reach out to the store/parent
    // For simplicity, we'll expose a method or use a callback
    // But since Crepe is isolated, we'll trigger a custom event on the window or use a provided prop
    // Actually, we can use the same logic as before if we can access the parent context
    
    // Create a temporary URL for immediate preview
    const tempUrl = URL.createObjectURL(file);
    
    // We need to trigger the actual upload. We'll dispatch a custom event
    // that NotesOverview.vue can listen to.
    const event = new CustomEvent('milkdown-upload', { 
      detail: { file, callback: (url: string) => {
        // This is tricky with Crepe's internal state.
        // Crepe's onUpload expects a returned URL.
      }} 
    });
    window.dispatchEvent(event);

    // For now, let's assume we want to handle it here.
    // We'll need the uploadAttachment function from the store.
    // Since we are in a component, we can use the store.
    return tempUrl; // Placeholder - the actual upload logic should be better integrated
  } catch (error) {
    console.error('Upload failed:', error);
    return '';
  }
};

const isReady = ref(false);

onMounted(async () => {
  if (!editorRef.value) return;

  crepe = new Crepe({
    root: editorRef.value,
    defaultValue: props.modelValue,
    featureConfigs: {
      'image-block': {
        onUpload: async (file: File) => {
          console.log('Crepe uploading file:', file.name);
          return URL.createObjectURL(file);
        },
      },
    },
  });

  // Enable listener to sync with modelValue
  crepe.editor.use(listener);
  crepe.editor.config((ctx) => {
    ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
      if (markdown !== props.modelValue) {
        isInternalUpdate = true;
        emit('update:modelValue', markdown);
      }
    });
  });

  await crepe.create();
  isReady.value = true;
  
  // Set read-only mode if needed
  if (props.readOnly) {
    crepe.setReadonly(true);
  }

  // Final check to sync content after creation
  if (props.modelValue !== crepe.getMarkdown()) {
    crepe.editor.action(replaceAll(props.modelValue));
  }
});

watch(() => props.modelValue, (newVal) => {
  console.log('MilkdownEditor: modelValue changed to:', newVal?.substring(0, 20) + '...');
  if (isInternalUpdate) {
    console.log('MilkdownEditor: internal update, skipping');
    isInternalUpdate = false;
    return;
  }
  if (crepe && isReady.value) {
    const current = crepe.getMarkdown();
    if (newVal !== current) {
      console.log('MilkdownEditor: updating crepe content');
      crepe.editor.action(replaceAll(newVal));
    }
  } else {
    console.log('MilkdownEditor: editor not ready yet');
  }
});

watch(() => props.readOnly, (newVal) => {
  console.log('MilkdownEditor: readOnly changed to:', newVal);
  if (crepe) {
    crepe.setReadonly(!!newVal);
  }
});

onBeforeUnmount(() => {
  if (crepe) {
    crepe.destroy();
  }
});
</script>

<style scoped>
.milkdown-editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: transparent;
}

.crepe-root {
  flex: 1;
  overflow-y: auto;
  height: 100%;
}

/* Customizing Crepe for both themes */
:deep(.crepe-root) .milkdown {
  background-color: transparent !important;
  color: var(--color-on-surface) !important;
  max-width: 100% !important;
  padding: 1.5rem !important; /* Reduced padding for better fit */
}

/* Fix for Crepe code blocks and editor areas */
:deep(.crepe-root) .ProseMirror,
:deep(.crepe-root) .ProseMirror *,
:deep(.crepe-root) .milkdown,
:deep(.crepe-root) .milkdown *,
:deep(.crepe-root) .editor,
:deep(.crepe-root) .editor *,
:deep(.crepe-root) div,
:deep(.crepe-root) p,
:deep(.crepe-root) span,
:deep(.crepe-root) li {
  background-color: transparent !important;
}

/* Specific fix for text color to ensure it matches the theme */
:deep(.crepe-root) .ProseMirror {
  color: var(--color-on-surface) !important;
}

/* Ensure task lists and headings match the system */
:deep(.crepe-root) .task-list-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

:deep(.crepe-root) h1, :deep(.crepe-root) h2, :deep(.crepe-root) h3 {
  color: var(--color-on-surface) !important;
  font-weight: 600;
  background-color: transparent !important;
}

/* Scrollbar styling - subtle and theme-aware */
:deep(.crepe-root)::-webkit-scrollbar {
  width: 6px;
}
:deep(.crepe-root)::-webkit-scrollbar-track {
  background: transparent;
}
:deep(.crepe-root)::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
  border-radius: 10px;
}
:deep(.crepe-root)::-webkit-scrollbar-thumb:hover {
  background: var(--color-outline);
}

/* Placeholder styling - balanced visibility */
:deep(.crepe-root) .cm-placeholder,
:deep(.crepe-root) .milkdown-placeholder,
:deep(.crepe-root) [data-placeholder]::before {
  color: var(--color-on-surface-variant) !important;
  opacity: 0.6 !important;
  font-style: italic;
}

/* Map Crepe variables to system variables for both themes */
:deep(.crepe-root) .milkdown,
:deep(.crepe-root) {
  --crepe-color-surface: var(--color-surface);
  --crepe-color-on-surface: var(--color-on-surface);
  --crepe-color-on-surface-variant: var(--color-on-surface-variant);
  --crepe-color-outline-variant: var(--color-outline-variant);
  --crepe-color-primary: var(--color-primary);
  --crepe-color-secondary: var(--color-secondary);
  --crepe-color-background: transparent;
}

/* Dark mode specific fine-tuning */
.dark :deep(.crepe-root) .milkdown,
.dark :deep(.crepe-root) {
  --crepe-color-surface: var(--color-surface);
  --crepe-color-on-surface: var(--color-on-surface);
  --crepe-color-on-surface-variant: var(--color-outline);
  --crepe-color-outline-variant: var(--color-outline-variant);
  --crepe-color-primary: var(--color-primary);
  --crepe-color-secondary: var(--color-secondary);
  --crepe-color-background: transparent;
}

.dark :deep(.crepe-root) .cm-placeholder,
.dark :deep(.crepe-root) .milkdown-placeholder,
.dark :deep(.crepe-root) [data-placeholder]::before {
  color: var(--color-outline) !important;
  opacity: 0.8 !important;
}

/* Ensure nothing has a white background in dark mode */
.dark :deep(.crepe-root) .milkdown .editor p,
.dark :deep(.crepe-root) .milkdown .editor li,
.dark :deep(.crepe-root) .milkdown .editor blockquote {
  background-color: transparent !important;
}
</style>
