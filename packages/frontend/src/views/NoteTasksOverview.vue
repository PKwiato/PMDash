<template>
  <div class="p-lg max-w-[1400px] mx-auto">
    <header class="flex justify-between items-end mb-xl">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-slate-900">Note Tasks</h1>
        <p class="font-body-md text-body-md text-slate-500 mt-xs">Aggregate view of all checkboxes and to-do items from your private notes.</p>
      </div>
      <div class="flex gap-sm">
        <div class="flex bg-slate-100 p-1 rounded-lg">
          <button 
            @click="filter = 'all'" 
            class="px-4 py-1.5 rounded-md font-label-md transition-all"
            :class="filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >All</button>
          <button 
            @click="filter = 'todo'" 
            class="px-4 py-1.5 rounded-md font-label-md transition-all"
            :class="filter === 'todo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >To Do</button>
          <button 
            @click="filter = 'done'" 
            class="px-4 py-1.5 rounded-md font-label-md transition-all"
            :class="filter === 'done' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >Done</button>
        </div>
      </div>
    </header>

    <div v-if="notesStore.loading" class="flex items-center justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-[32px] text-secondary">sync</span>
    </div>
    <div v-else-if="notesStore.error" class="text-center py-20 text-error">
      <p class="font-label-md">{{ notesStore.error }}</p>
    </div>
    <div v-else-if="filteredTasks.length === 0" class="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
      <span class="material-symbols-outlined text-[48px] text-slate-200 mb-4">checklist</span>
      <p class="font-headline-sm text-slate-400">No tasks found</p>
      <p class="font-body-md text-slate-400 mt-2">Create some tasks in your notes using - [ ] syntax.</p>
    </div>
    
    <div v-else class="space-y-8">
      <div v-for="(group, noteId) in groupedTasks" :key="noteId" class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-slate-400">description</span>
            <h2 class="font-headline-sm text-slate-900">{{ group.noteTitle }}</h2>
          </div>
          <router-link :to="{ name: 'notes-overview' }" class="text-secondary font-label-md hover:underline flex items-center gap-1">
            Open Note
            <span class="material-symbols-outlined text-[16px]">open_in_new</span>
          </router-link>
        </div>
        
        <div class="divide-y divide-slate-100">
          <div v-for="task in group.tasks" :key="task.noteId + '-' + task.line" 
               class="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
            <div class="mt-0.5">
              <span class="material-symbols-outlined text-[24px]" 
                    :class="task.completed ? 'text-success' : 'text-slate-300'">
                {{ task.completed ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
            </div>
            <div class="flex-1">
              <p class="font-body-md text-slate-700 leading-relaxed" :class="{ 'line-through text-slate-400': task.completed }">
                {{ task.text }}
              </p>
              <div class="mt-1 flex items-center gap-3">
                <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Line {{ task.line }}</span>
                <span v-if="getJiraKey(task.text)" class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-bold">
                  {{ getJiraKey(task.text) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useNotesStore, type NoteTask } from '../stores/notesStore';

const notesStore = useNotesStore();
const filter = ref<'all' | 'todo' | 'done'>('all');

onMounted(async () => {
  await notesStore.fetchAllNoteTasks();
});

const filteredTasks = computed(() => {
  if (filter.value === 'all') return notesStore.noteTasks;
  if (filter.value === 'todo') return notesStore.noteTasks.filter(t => !t.completed);
  return notesStore.noteTasks.filter(t => t.completed);
});

const groupedTasks = computed(() => {
  const groups: Record<string, { noteTitle: string, tasks: NoteTask[] }> = {};
  
  filteredTasks.value.forEach(task => {
    if (!groups[task.noteId]) {
      groups[task.noteId] = {
        noteTitle: task.noteTitle,
        tasks: []
      };
    }
    groups[task.noteId].tasks.push(task);
  });
  
  return groups;
});

function getJiraKey(text: string) {
  const match = text.match(/[A-Z]+-\d+/);
  return match ? match[0] : null;
}
</script>

<style scoped>
.text-success {
  color: #10b981;
}
</style>
