<template>
  <div class="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
    <!-- Toolbar / Breadcrumbs -->
    <div class="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-slate-400 font-label-sm text-label-sm uppercase">Projects</span>
        <span class="text-slate-300">/</span>
        <router-link v-if="issue?.epicKey" :to="`/tasks/${issue.epicKey}`" class="text-slate-400 font-label-sm text-label-sm uppercase hover:text-secondary">
          {{ issue.epicKey }}
        </router-link>
        <span v-if="issue?.epicKey" class="text-slate-300">/</span>
        <span class="text-slate-400 font-label-sm text-label-sm uppercase">{{ issueId }}</span>
        <span v-if="issue" class="text-slate-300">/</span>
        <span v-if="issue" class="text-slate-900 font-label-md text-label-md">{{ issue.summary }}</span>
      </div>
      <div class="flex items-center gap-4">
        <button class="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-label-sm text-label-sm">
          <span class="material-symbols-outlined text-[16px]">share</span>
          Share
        </button>
      </div>
    </div>
    
    <!-- Task Content Area -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <span class="material-symbols-outlined animate-spin text-[32px] text-secondary">sync</span>
    </div>
    <div v-else-if="issue" class="flex-1 flex overflow-hidden">
      <!-- Left Panel: Official Jira Data -->
      <div class="flex-1 overflow-y-auto p-6 bg-white border-r border-slate-200 custom-scrollbar">
        <div class="max-w-4xl mx-auto space-y-8">
          <!-- Header Info -->
          <div class="space-y-4">
            <div class="flex items-start justify-between">
              <h1 class="font-headline-lg text-headline-lg text-slate-900">{{ issue.summary }}</h1>
              <div class="flex gap-2">
                <span class="px-2 py-1 bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-secondary"></span>
                  {{ issue.status }}
                </span>
                <span class="px-2 py-1 bg-error-container text-on-error-container rounded font-label-sm text-label-sm flex items-center gap-1" v-if="issue.priority">
                  <span class="material-symbols-outlined text-[14px]">priority_high</span>
                  {{ issue.priority.toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-6 py-4 border-y border-slate-100">
              <div>
                <p class="text-slate-400 font-label-sm text-label-sm uppercase mb-1">Assignee</p>
                <div class="flex items-center gap-2" v-if="issue.assignee">
                  <span class="font-body-md text-body-md text-slate-900 font-medium">{{ issue.assignee }}</span>
                </div>
                <span v-else class="text-body-md text-slate-500">Unassigned</span>
              </div>
              <div>
                <p class="text-slate-400 font-label-sm text-label-sm uppercase mb-1">Type</p>
                <span class="font-body-md text-body-md text-slate-900">{{ issue.issueType }}</span>
              </div>
              <div>
                <p class="text-slate-400 font-label-sm text-label-sm uppercase mb-1">Story Points</p>
                <span v-if="issue.storyPoints" class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold text-body-md border border-indigo-100">
                  {{ issue.storyPoints }}
                </span>
                <span v-else class="text-body-md text-slate-400 italic">None</span>
              </div>
            </div>
          </div>
          <!-- Description Section -->
          <div class="space-y-3">
            <h3 class="font-headline-md text-headline-md text-slate-900">Description</h3>
            <div 
              class="prose prose-slate max-w-none prose-p:my-2 prose-headings:mb-4 prose-headings:mt-6 first:prose-headings:mt-0 font-body-lg text-body-lg text-slate-700 leading-relaxed" 
              v-html="renderMarkdown(issue.description)"
            >
            </div>
          </div>

          <!-- Sub-tasks Section -->
          <div class="pt-8 border-t border-slate-100 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-slate-900">
                <span class="material-symbols-outlined text-[20px] text-indigo-500">account_tree</span>
                <h3 class="font-headline-md text-headline-md">Sub-tasks <span v-if="issue.subtasks?.length" class="text-slate-400 font-normal">({{ issue.subtasks.length }})</span></h3>
              </div>
              <button class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                <span class="material-symbols-outlined">add</span>
              </button>
            </div>
            <div v-if="issue.subtasks && issue.subtasks.length > 0" class="grid gap-3">
              <router-link 
                v-for="subtask in issue.subtasks" 
                :key="subtask.id"
                :to="`/tasks/${subtask.key}`"
                class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-secondary transition-colors group"
              >
                <div class="flex items-center gap-3">
                  <span class="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 group-hover:text-secondary group-hover:border-secondary">
                    {{ subtask.key }}
                  </span>
                  <span class="font-body-md text-body-md text-slate-700">{{ subtask.summary }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-label-sm text-label-sm uppercase tracking-wider">
                    {{ subtask.status }}
                  </span>
                </div>
              </router-link>
            </div>
            <div v-else class="p-4 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-body-md italic bg-slate-50/30">
              No sub-tasks yet. Click + to add one.
            </div>
          </div>

          <!-- Linked Issues Section -->
          <div class="pt-8 border-t border-slate-100 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-slate-900">
                <span class="material-symbols-outlined text-[20px] text-amber-500">link</span>
                <h3 class="font-headline-md text-headline-md">Linked Issues</h3>
              </div>
              <button class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                <span class="material-symbols-outlined">add</span>
              </button>
            </div>
            <div v-if="(issue.linkedIssues && issue.linkedIssues.length > 0) || mentionedIssues.length > 0" class="grid gap-3">
              <!-- Formal Links -->
              <router-link 
                v-for="link in issue.linkedIssues" 
                :key="link.id"
                :to="`/tasks/${link.key}`"
                class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-secondary transition-colors group"
              >
                <div class="flex items-center gap-3">
                  <span class="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 group-hover:text-secondary group-hover:border-secondary">
                    {{ link.key }}
                  </span>
                  <span class="font-body-md text-body-md text-slate-700">{{ link.summary }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-label-sm text-label-sm uppercase tracking-wider">
                    {{ link.status }}
                  </span>
                </div>
              </router-link>

              <!-- Mentioned Links -->
              <router-link 
                v-for="mKey in mentionedIssues" 
                :key="mKey"
                :to="`/tasks/${mKey}`"
                class="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl hover:border-secondary transition-colors group"
              >
                <div class="flex items-center gap-3">
                  <span class="px-2 py-0.5 bg-white border border-indigo-200 rounded text-[10px] font-bold text-indigo-500 group-hover:text-secondary group-hover:border-secondary">
                    {{ mKey }}
                  </span>
                  <span v-if="getIssueFromStore(mKey)" class="font-body-md text-body-md text-slate-700">
                    {{ getIssueFromStore(mKey)?.summary }}
                  </span>
                  <span v-else class="font-body-md text-body-md text-slate-400 italic">Fetching details...</span>
                </div>
                <div v-if="getIssueFromStore(mKey)" class="flex items-center gap-3">
                  <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-label-sm text-label-sm uppercase tracking-wider">
                    {{ getIssueFromStore(mKey)?.status }}
                  </span>
                </div>
              </router-link>
            </div>
            <div v-else class="p-4 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-body-md italic bg-slate-50/30">
              No linked issues. Use + to link a ticket.
            </div>
          </div>

          <!-- Comments Section -->
          <div class="pt-8 border-t border-slate-100 space-y-6">
            <div class="flex items-center gap-2 text-slate-900">
              <span class="material-symbols-outlined text-[20px]">forum</span>
              <h3 class="font-headline-md text-headline-md">Comments ({{ issue.comments?.length || 0 }})</h3>
            </div>
            
            <div v-if="issue.comments && issue.comments.length > 0" class="space-y-6">
              <div v-for="comment in issue.comments" :key="comment.id" class="flex gap-4 group">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 border border-slate-200">
                  <span class="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div class="flex-1 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-label-md text-label-md text-slate-900">{{ comment.author }}</span>
                    <span class="text-label-sm text-slate-400">{{ formatDate(comment.created) }}</span>
                  </div>
                  <div 
                    class="prose prose-slate prose-sm max-w-none text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100 group-hover:border-slate-200 transition-colors"
                    v-html="renderMarkdown(comment.body)"
                  >
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-slate-400 italic font-body-md">No comments yet.</p>
          </div>
        </div>
      </div>
      <!-- Right Panel: Private Notes (Dedicated Rich Text Editor) -->
      <div class="w-[450px] bg-slate-50 border-l border-slate-200 flex flex-col">
        <div class="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div class="flex items-center gap-2 text-teal-700">
            <span class="material-symbols-outlined">edit_note</span>
            <h2 class="font-headline-md text-headline-md">Private Notes</h2>
          </div>
          <div class="flex gap-2">
            <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Lock Note">
              <span class="material-symbols-outlined text-[20px]">lock_open</span>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
              <span class="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </div>
        <!-- Rich Text Editor Container -->
        <div class="flex-1 flex flex-col p-6 space-y-4">
          <div class="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden focus-within:border-teal-500 transition-all">
            <!-- Editor Toolbar -->
            <div class="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-1">
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_bold</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_italic</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_underlined</span></button>
              <div class="w-[1px] bg-slate-200 mx-1"></div>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
              <div class="w-[1px] bg-slate-200 mx-1"></div>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">link</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">image</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600 ml-auto"><span class="material-symbols-outlined text-[18px]">code</span></button>
            </div>
            <!-- Editor Content -->
            <div 
              ref="editorRef"
              class="flex-1 p-4 font-body-md text-body-md text-slate-800 outline-none overflow-y-auto" 
              contenteditable="true"
              @input="handleInput"
              @focus="handleFocus"
              @blur="handleBlur"
            >
            </div>
            <!-- Editor Footer -->
            <div class="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {{ isDirty ? 'Unsaved' : 'Saved' }}
              </span>
              <div class="flex items-center gap-2">
                <button 
                  class="px-3 py-1 text-slate-500 font-label-sm text-label-sm hover:bg-slate-100 rounded"
                  @click="clearNote"
                >
                  Clear
                </button>
                <button 
                  class="px-4 py-1.5 bg-secondary text-white font-label-md text-label-md rounded shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  :disabled="!isDirty || saving"
                  @click="saveNote"
                >
                  {{ saving ? 'Saving...' : 'Save Note' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
      <p class="text-error font-body-lg">Task not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useJiraStore } from '../stores/jiraStore';
import { useNotesStore } from '../stores/notesStore';
import { useProjectsStore } from '../stores/projectsStore';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const route = useRoute();
const jiraStore = useJiraStore();
const notesStore = useNotesStore();
const projectsStore = useProjectsStore();

const issueId = computed(() => route.params.id as string);
const loading = ref(true);
const saving = ref(false);
const isDirty = ref(false);
const noteBody = ref('');
const editorRef = ref<HTMLElement | null>(null);

const isFocused = ref(false);

const issue = computed(() => jiraStore.issues.find(i => i.key === issueId.value));

const mentionedIssues = computed(() => {
  if (!issue.value?.description) return [];
  // Extract patterns like ABC-123
  const regex = /([A-Z]+-[0-9]+)/g;
  const matches = issue.value.description.match(regex) || [];
  
  // Filter out current issue key, duplicates, and issues already in linkedIssues or subtasks
  const existingKeys = new Set([
    issueId.value,
    ...(issue.value.linkedIssues?.map(l => l.key) || []),
    ...(issue.value.subtasks?.map(s => s.key) || [])
  ]);

  return [...new Set(matches.filter(k => !existingKeys.has(k)))];
});

function getIssueFromStore(key: string) {
  return jiraStore.issues.find(i => i.key === key);
}

function renderMarkdown(content: string | null | undefined) {
  if (!content) return '<p class="text-slate-500 italic">No content provided.</p>';
  try {
    const html = marked.parse(content, {
      gfm: true,
      breaks: true,
    }) as string;
    return DOMPurify.sanitize(html);
  } catch (err) {
    console.error('Failed to parse markdown:', err);
    return `<p class="text-slate-700 whitespace-pre-wrap">${content}</p>`;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function handleFocus() {
  isFocused.value = true;
  if (!noteBody.value && editorRef.value) {
    editorRef.value.innerHTML = '';
  }
}

function handleBlur() {
  isFocused.value = false;
  if (!noteBody.value && editorRef.value) {
    editorRef.value.innerHTML = '<p class="text-slate-400 italic">No notes found for this task yet. Start typing to create one...</p>';
  }
}

function handleInput() {
  if (editorRef.value) {
    // If it's just our placeholder, ignore
    if (editorRef.value.innerText.trim() === 'No notes found for this task yet. Start typing to create one...' && !isFocused.value) {
      return;
    }
    noteBody.value = editorRef.value.innerHTML;
    isDirty.value = true;
  }
}

async function saveNote() {
  if (!issue.value) return;
  
  saving.value = true;
  try {
    if (notesStore.currentNote) {
      await notesStore.updateNote(notesStore.currentNote.id, noteBody.value);
    } else {
      // Create new note
      // Find matching project by prefix
      const prefix = issueId.value.split('-')[0];
      const expectedSlug = `jira-project-${prefix.toLowerCase()}`;
      let project = projectsStore.projects.find(p => 
        p.jiraProjectKey === prefix || p.slug === expectedSlug
      );
      
      if (!project) {
        // Auto-create a project if no local projects exist at all
        console.log(`Auto-creating project for Jira prefix ${prefix}...`);
        try {
          project = await projectsStore.createProject(`Jira Project ${prefix}`, `Auto-generated project for ${prefix} tasks`, prefix);
        } catch (err: any) {
          if (err.response?.status === 409) {
            console.log("Project already exists on backend, refetching...");
            await projectsStore.fetchProjects();
            project = projectsStore.projects.find(p => p.jiraProjectKey === prefix || p.slug === expectedSlug);
          } else {
            throw err;
          }
        }
      }
      
      if (!project) throw new Error("Failed to resolve project for note");
      
      const baseTitle = `${issueId.value}: ${issue.value.summary}`;
      const existingCount = notesStore.notes.filter(n => n.title.startsWith(baseTitle)).length;
      const suffix = existingCount > 0 ? ` (${existingCount + 1})` : '';
      await notesStore.createNote(project.id, `${baseTitle}${suffix}`, noteBody.value);
    }
    isDirty.value = false;
  } catch (err) {
    alert('Failed to save note');
  } finally {
    saving.value = false;
  }
}

function clearNote() {
  noteBody.value = '';
  if (editorRef.value) {
    editorRef.value.innerHTML = '';
  }
  isDirty.value = true;
}

onMounted(async () => {
  loading.value = true;
  
  // Parallel fetch
  await Promise.all([
    jiraStore.fetchIssuesByKeys([issueId.value]),
    notesStore.fetchAllNotes(),
    projectsStore.fetchProjects()
  ]);

  // If there are mentioned issues, fetch them too
  if (mentionedIssues.value.length > 0) {
    await jiraStore.fetchIssuesByKeys(mentionedIssues.value);
  }
  
  // Find note for this task
  await notesStore.fetchNoteByJiraKey(issueId.value);
  
  loading.value = false;
  await nextTick();

  if (notesStore.currentNote) {
    noteBody.value = notesStore.currentNote.body || '';
    if (editorRef.value) {
      editorRef.value.innerHTML = noteBody.value;
    }
  } else if (editorRef.value) {
    editorRef.value.innerHTML = '<p class="text-slate-400 italic">No notes found for this task yet. Start typing to create one...</p>';
  }
});

// Watch for note changes if we switch tasks (though router should handle it via remount)
watch(() => notesStore.currentNote, (newNote) => {
  if (newNote) {
    noteBody.value = newNote.body;
    if (editorRef.value) {
      editorRef.value.innerHTML = noteBody.value;
    }
    isDirty.value = false;
  }
});
</script>
