<template>
  <div class="p-lg max-w-[1400px] mx-auto">
    <header class="flex justify-between items-end mb-xl">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-slate-900">Private Notes</h1>
        <p class="font-body-md text-body-md text-slate-500 mt-xs">Personal thoughts and draft documentation for your current projects.</p>
      </div>
      <div class="flex gap-sm">
        <button class="px-md py-2 border border-outline-variant text-slate-600 rounded flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[18px]">filter_list</span>
          <span class="font-label-md text-label-md">Filter</span>
        </button>
        <router-link :to="{ name: 'note-tasks' }" class="px-md py-2 border border-outline-variant text-slate-600 rounded flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[18px]">checklist</span>
          <span class="font-label-md text-label-md">View All Tasks</span>
        </router-link>
        <button @click="openNewNoteModal" class="px-md py-2 bg-secondary text-white rounded flex items-center gap-2 hover:bg-opacity-90 transition-colors">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span class="font-label-md text-label-md">Create Note</span>
        </button>
      </div>
    </header>

    <div v-if="notesStore.loading" class="flex items-center justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-[32px] text-secondary">sync</span>
    </div>
    <div v-else-if="notesStore.error" class="text-center py-20 text-error">
      <p class="font-label-md">{{ notesStore.error }}</p>
    </div>
    <!-- Bento Grid Layout for Notes -->
    <div v-else class="grid grid-cols-12 gap-gutter">
      <!-- Standard Note Cards -->
      <div v-for="note in notesStore.notes" :key="note.id" 
           @click="openEditNoteModal(note)"
           class="col-span-12 md:col-span-6 lg:col-span-4 group bg-white border border-slate-200 rounded-xl p-lg flex flex-col note-card transition-all duration-200 hover:bg-slate-50 cursor-pointer relative">
        
        <button 
          @click.stop="confirmDeleteNote(note)" 
          class="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
          title="Delete Note"
        >
          <span class="material-symbols-outlined text-[20px]">delete</span>
        </button>

        <div class="mb-md flex gap-sm pr-10" v-if="getJiraKeys(note.title).length > 0">
          <span v-for="key in getJiraKeys(note.title)" :key="key" 
                class="font-label-md text-label-md px-2 py-0.5 rounded flex items-center gap-1"
                :class="getJiraStatusClass(key)">
            {{ key }}
            <span class="text-[10px] uppercase ml-1">{{ getJiraStatusText(key) }}</span>
          </span>
        </div>
        <h3 class="font-headline-md text-headline-md text-slate-900 mb-sm">{{ cleanTitle(note.title) }}</h3>
        <p class="font-body-sm text-body-sm text-slate-500 line-clamp-2">
          Project: {{ note.projectId }}
        </p>
        <div class="mt-md pt-md border-t border-slate-100 flex items-center justify-between gap-sm text-slate-400 font-body-sm text-body-sm">
          <div class="flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">schedule</span>
            <span>{{ new Date(note.updatedAt).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>
      
      <!-- Asymmetric Accent Card -->
      <div class="col-span-12 lg:col-span-4 bg-primary-container text-on-primary-container rounded-xl p-lg flex flex-col relative overflow-hidden group cursor-pointer hover:bg-primary-container/90 transition-colors">
        <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <span class="material-symbols-outlined text-[120px]">lightbulb</span>
        </div>
        <h3 class="font-headline-md text-headline-md text-white mb-md">Quick Idea?</h3>
        <p class="font-body-sm text-body-sm text-primary-fixed-dim mb-lg relative z-10">
          Don't let inspiration slip away. Jot down a quick scratchpad note that isn't tied to a task yet.
        </p>
        <button @click="openNewNoteModal" class="mt-auto w-fit px-4 py-2 bg-secondary-container text-on-secondary-container rounded font-label-md text-label-md hover:bg-secondary-fixed transition-colors relative z-10">
          Start Scratchpad
        </button>
      </div>
      
      <!-- Large Table-style note entry -->
      <div class="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden mt-xl">
        <div class="p-md border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-label-md text-label-md text-slate-500 uppercase tracking-wider">Recently Referenced Tasks</h3>
          <button class="text-teal-600 font-label-sm text-label-sm hover:underline">View All Tasks</button>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="issue in referencedJiraTasks" :key="issue.key" class="p-md flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
            <div class="flex items-center gap-md">
              <span class="font-label-md text-label-md text-secondary w-16">{{ issue.key }}</span>
              <div>
                <p class="font-body-md text-body-md text-slate-900">{{ issue.summary }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="inline-block w-2 h-2 rounded-full" :class="{
                      'bg-green-500': issue.status === 'Done',
                      'bg-blue-500': issue.status === 'In Progress',
                      'bg-slate-300': !['Done', 'In Progress'].includes(issue.status)
                  }"></span>
                  <span class="text-[11px] text-slate-500 uppercase">{{ issue.status }}</span>
                </div>
              </div>
            </div>
            <span class="text-body-sm text-slate-400">Jira Issue</span>
          </div>
          <div v-if="referencedJiraTasks.length === 0" class="p-md text-center text-slate-500 font-body-sm">
            No Jira tasks referenced in current notes.
          </div>
        </div>
      </div>
    </div>

    <!-- Note Editor Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div class="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[85vh] overflow-hidden text-[#dcddde]">
        <div class="p-4 border-b border-[#333] flex justify-between items-center bg-[#262626]">
          <div class="flex items-center gap-3 flex-1">
            <span class="material-symbols-outlined text-[#7b61ff]">description</span>
            <input 
              v-model="activeNoteTitle" 
              placeholder="Untitled Note" 
              :disabled="!!activeNoteId"
              class="font-headline-md text-headline-md text-white bg-transparent border-none outline-none flex-1 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-600" 
            />
          </div>
          <div class="flex items-center gap-2">
            <button @click="closeModal" class="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <span class="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-hidden flex flex-col bg-[#1e1e1e]">
          <!-- Obsidian-style Toolbar -->
          <div class="px-3 py-1 border-b border-[#333] bg-[#1e1e1e] flex flex-wrap gap-0.5 items-center">
            <template v-if="!isSourceMode">
              <button @mousedown.prevent @click="format('bold')" class="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Bold (Ctrl+B)">
                <span class="material-symbols-outlined text-[18px]">format_bold</span>
              </button>
              <button @mousedown.prevent @click="format('italic')" class="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Italic (Ctrl+I)">
                <span class="material-symbols-outlined text-[18px]">format_italic</span>
              </button>
              <div class="w-[1px] h-4 bg-[#333] mx-1"></div>
              <button @mousedown.prevent @click="format('heading')" class="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Heading">
                <span class="material-symbols-outlined text-[18px]">title</span>
              </button>
              <button @mousedown.prevent @click="format('list')" class="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Bullet List">
                <span class="material-symbols-outlined text-[18px]">format_list_bulleted</span>
              </button>
              <button @mousedown.prevent @click="format('task')" class="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Task List">
                <span class="material-symbols-outlined text-[18px]">checklist</span>
              </button>
              <div class="w-[1px] h-4 bg-[#333] mx-1"></div>
              <button @mousedown.prevent @click="format('link')" class="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Link">
                <span class="material-symbols-outlined text-[18px]">link</span>
              </button>
            </template>
            <div v-else class="px-2 text-slate-500 text-[11px] uppercase tracking-wider font-bold">Source Mode</div>

            <div class="flex-1"></div>

            <button @click="isSourceMode = !isSourceMode" 
                    class="px-3 py-1 rounded flex items-center gap-1.5 transition-all duration-200"
                    :class="isSourceMode ? 'bg-[#7b61ff] text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'">
              <span class="material-symbols-outlined text-[18px]">{{ isSourceMode ? 'code' : 'menu_book' }}</span>
              <span class="font-label-sm">{{ isSourceMode ? 'Source' : 'Live' }}</span>
            </button>
          </div>

          <!-- Editor Area -->
          <div class="flex-1 relative bg-[#1e1e1e] flex flex-col overflow-hidden">
            <template v-if="!isSourceMode">
              <MilkdownWrapper 
                v-if="isModalOpen" 
                :modelValue="activeNoteBody"
                @update:modelValue="activeNoteBody = $event"
                :noteId="activeNoteId"
                @uploadAttachment="handleUploadAttachment"
              />
            </template>
            <template v-else>
              <textarea 
                ref="editorRef"
                v-model="activeNoteBody"
                class="flex-1 w-full p-6 outline-none whitespace-pre-wrap break-words font-mono text-[14px] leading-[1.6] text-[#dcddde] caret-[#7b61ff] bg-transparent resize-none overflow-y-auto" 
                spellcheck="false"
              ></textarea>
            </template>
          </div>
        </div>

        <div class="p-4 border-t border-[#333] bg-[#262626] flex justify-end gap-3">
          <button @click="closeModal" class="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded font-label-md transition-colors">Cancel</button>
          <button @click="saveNote(true)" :disabled="saving" class="px-6 py-2 bg-[#7b61ff] text-white rounded font-label-md hover:bg-[#6a50ee] transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20">
            <span v-if="saving" class="material-symbols-outlined animate-spin text-[16px]">sync</span>
            {{ saving ? 'Saving...' : 'Save Note' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, nextTick } from 'vue';
import { useNotesStore } from '../stores/notesStore';
import { useJiraStore } from '../stores/jiraStore';
import { useProjectsStore } from '../stores/projectsStore';
import { useRoute, useRouter } from 'vue-router';
import MilkdownWrapper from '../components/MilkdownWrapper.vue';

const notesStore = useNotesStore();
const jiraStore = useJiraStore();
const projectsStore = useProjectsStore();
const route = useRoute();
const router = useRouter();

const isModalOpen = ref(false);
const activeNoteId = ref<string | null>(null);
const activeNoteTitle = ref('');
const activeNoteBody = ref('');
const editorRef = ref<HTMLTextAreaElement | null>(null);
const saving = ref(false);
const isSourceMode = ref(false);

function openNewNoteModal() {
  activeNoteId.value = null;
  activeNoteTitle.value = '';
  activeNoteBody.value = '';
  isModalOpen.value = true;
  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.focus();
    }
  });
}

async function openEditNoteModal(note: any) {
  activeNoteId.value = note.id;
  activeNoteTitle.value = note.title;
  activeNoteBody.value = 'Loading...';
  isModalOpen.value = true;

  try {
    await notesStore.fetchNoteDetail(note.id);
    if (notesStore.currentNote) {
      activeNoteTitle.value = notesStore.currentNote.title;
      activeNoteBody.value = notesStore.currentNote.body || '';
    }
  } catch (err) {
    console.error("Failed to load note detail", err);
    activeNoteBody.value = 'Error loading note.';
  }
}

function closeModal() {
  isModalOpen.value = false;
  isSourceMode.value = false;
}

function format(type: string) {
  if (!editorRef.value) return;
  const textarea = editorRef.value as HTMLTextAreaElement;
  textarea.focus();

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  
  let before = '';
  let after = '';
  
  const textBefore = textarea.value.substring(0, start);
  const isStartOfLine = textBefore.length === 0 || textBefore.endsWith('\n');

  switch(type) {
    case 'bold': before = '**'; after = '**'; break;
    case 'italic': before = '_'; after = '_'; break;
    case 'heading': before = isStartOfLine ? '### ' : '\n### '; break;
    case 'list': before = isStartOfLine ? '- ' : '\n- '; break;
    case 'task': before = isStartOfLine ? '- [ ] ' : '\n- [ ] '; break;
    case 'code': before = '`'; after = '`'; break;
    case 'quote': before = isStartOfLine ? '> ' : '\n> '; break;
    case 'link': before = '[['; after = ']]'; break;
    case 'image': before = '!['; after = '](https://)'; break;
  }

  const textToInsert = before + selectedText + after;
  document.execCommand('insertText', false, textToInsert);
}

async function handleUploadAttachment(file: File, resolve: (url: string) => void, reject: (err: any) => void) {
  if (!activeNoteId.value) {
    if (!activeNoteTitle.value.trim()) {
      alert("Please enter a title before uploading images.");
      reject(new Error("No title"));
      return;
    }
    try {
      await saveNote(false);
    } catch (err) {
      reject(err);
      return;
    }
  }
  
  if (activeNoteId.value) {
    try {
      const url = await notesStore.uploadAttachment(activeNoteId.value, file);
      resolve(url);
    } catch (err) {
      reject(err);
    }
  } else {
    reject(new Error("Note ID not available"));
  }
}

async function saveNote(close: boolean = true) {
  console.log("Saving note...", { id: activeNoteId.value, title: activeNoteTitle.value });
  if (!activeNoteTitle.value.trim() && !activeNoteId.value) {
    alert("Please enter a title");
    return;
  }
  
  saving.value = true;
  try {
    if (activeNoteId.value) {
      console.log("Updating existing note:", activeNoteId.value);
      await notesStore.updateNote(activeNoteId.value, activeNoteBody.value, activeNoteTitle.value);
    } else {
      console.log("Creating new note. Current projects:", projectsStore.projects);
      let project = projectsStore.projects.find(p => p.title === 'Scratchpad' || p.slug === 'scratchpad');
      if (!project) {
        console.log("Scratchpad project not found, creating one...");
        project = await projectsStore.createProject('Scratchpad', 'General notes and scratchpad');
      }
      console.log("Saving to project:", project.id);
      const newNote = await notesStore.createNote(project.id, activeNoteTitle.value, activeNoteBody.value);
      activeNoteId.value = newNote.id; // Important for attachments to work immediately after saving a new note
    }
    await notesStore.fetchAllNotes();
    if (close) {
      closeModal();
    }
  } catch (err) {
    console.error("Save note failed:", err);
    alert('Failed to save note');
  } finally {
    saving.value = false;
  }
}

async function confirmDeleteNote(note: any) {
  console.log("Confirm delete for note:", note);
  if (confirm(`Are you sure you want to delete "${cleanTitle(note.title)}"?`)) {
    try {
      console.log("Deleting note:", note.id);
      await notesStore.deleteNote(note.id);
    } catch (err) {
      console.error("Delete note failed:", err);
      alert("Failed to delete note.");
    }
  }
}

const jiraKeyRegex = /[A-Z]+-\d+/g;

function getJiraKeys(text: string): string[] {
  const matches = text.match(jiraKeyRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

function cleanTitle(title: string): string {
  return title.replace(jiraKeyRegex, '').trim().replace(/^[-:]\s*/, '');
}

function getJiraStatusText(key: string): string {
  const issue = jiraStore.issues.find(i => i.key === key);
  return issue ? issue.status : 'Unknown';
}

function getJiraStatusClass(key: string): string {
  const status = getJiraStatusText(key);
  if (status === 'Done') return 'text-green-800 bg-green-100 border-green-200';
  if (status === 'In Progress') return 'text-secondary bg-secondary-container border-secondary-container';
  if (status === 'Unknown') return 'text-slate-500 bg-slate-100 border-slate-200';
  return 'text-slate-700 bg-surface-container-high border-slate-200';
}

const referencedJiraTasks = computed(() => {
  const keys = new Set<string>();
  notesStore.notes.forEach(note => {
    getJiraKeys(note.title).forEach(k => keys.add(k));
  });
  return jiraStore.issues.filter(i => keys.has(i.key));
});

onMounted(async () => {
  try {
    await projectsStore.fetchProjects();
    await notesStore.fetchAllNotes();
    // Discover Jira keys in fetched notes
    await notesStore.discoverJiraTasksInNotes(notesStore.notes);

    if (route.query.openNote) {
      const noteToOpen = notesStore.notes.find((n: any) => n.id === route.query.openNote);
      if (noteToOpen) {
        openEditNoteModal(noteToOpen);
        router.replace({ query: {} });
      }
    }
  } catch (err) {
    console.error("Failed to initialize NotesOverview:", err);
  }
});
</script>
