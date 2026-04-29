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

<style>
.milkdown-editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #1e1e1e;
}

.crepe-root {
  flex: 1;
  overflow-y: auto;
  height: 100%;
}

/* Customizing Crepe for Dark Mode */
.crepe-root .milkdown {
  background-color: transparent !important;
  color: #dcddde !important;
  max-width: 100% !important;
  padding: 2rem !important;
}

/* Fix for Crepe in dark theme */
.crepe-root .cm-editor {
  background-color: #2b2b2b !important;
  color: #efefef !important;
}

/* Ensure task lists look good in Crepe */
.crepe-root .task-list-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

/* Fix Crepe's heading colors if they are too dark */
.crepe-root h1, .crepe-root h2, .crepe-root h3, .crepe-root h4 {
  color: #ffffff !important;
}

/* Scrollbar styling */
.crepe-root::-webkit-scrollbar {
  width: 8px;
}
.crepe-root::-webkit-scrollbar-track {
  background: #1e1e1e;
}
.crepe-root::-webkit-scrollbar-thumb {
  background: #3e3e3e;
  border-radius: 4px;
}
.crepe-root::-webkit-scrollbar-thumb:hover {
  background: #4e4e4e;
}
</style>
