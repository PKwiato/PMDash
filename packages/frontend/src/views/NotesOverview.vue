<template>
  <div class="p-lg max-w-[1400px] mx-auto">
    <header class="flex justify-between items-end mb-xl">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-on-surface">Private Notes</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-xs">Personal thoughts and draft documentation for your current projects.</p>
      </div>
      <div class="flex gap-sm items-center">
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] transition-colors group-focus-within:text-secondary">search</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search notes..." 
            class="pl-10 pr-10 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all w-[250px] font-body-sm"
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <router-link :to="{ name: 'note-tasks' }" class="px-md py-2 border border-outline-variant text-on-surface-variant rounded flex items-center gap-2 hover:bg-surface-container transition-colors">
          <span class="material-symbols-outlined text-[18px]">checklist</span>
          <span class="font-label-md text-label-md">View All Tasks</span>
        </router-link>
        <button
          v-if="archivedCount > 0"
          type="button"
          @click="showArchived = !showArchived"
          class="px-md py-2 border border-outline-variant text-on-surface-variant rounded flex items-center gap-2 hover:bg-surface-container transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">inventory_2</span>
          <span class="font-label-md text-label-md">{{ showArchived ? 'Ukryj archiwum' : 'Archiwum' }} ({{ archivedCount }})</span>
        </button>
        <button @click="openNewNoteModal" class="px-md py-2 bg-secondary text-on-secondary rounded flex items-center gap-2 hover:bg-secondary-fixed transition-colors">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span class="font-label-md text-label-md">Create Note</span>
        </button>
      </div>
    </header>

    <!-- Tag filter bar -->
    <div
      v-if="filterBarTags.length > 0"
      class="mb-lg flex items-center gap-2 flex-wrap p-3 bg-surface-container-low border border-outline-variant rounded-lg"
    >
      <span class="material-symbols-outlined text-[18px] text-on-surface-variant">sell</span>
      <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mr-1">Tagi:</span>
      <button
        v-for="t in filterBarTags"
        :key="t.slug"
        type="button"
        @click="toggleTagFilter(t.slug)"
        :class="['px-2.5 py-1 rounded-full text-label-sm font-label-sm border transition-colors flex items-center gap-1.5', tagChipClass(t.slug, t.category === 'custom')]"
        :title="t.category === 'custom' ? `Tag użytkownika (${t.count})` : `Auto-tag ${t.category} (${t.count})`"
      >
        <span class="truncate max-w-[180px]">{{ t.slug }}</span>
        <span class="opacity-70 text-[10px]">{{ t.count }}</span>
      </button>
      <button
        v-if="selectedTags.size > 0"
        type="button"
        @click="clearTagFilter"
        class="ml-auto px-2 py-1 text-on-surface-variant hover:text-on-surface flex items-center gap-1 font-label-sm"
      >
        <span class="material-symbols-outlined text-[16px]">filter_alt_off</span>
        Wyczyść filtr
      </button>
    </div>

    <div v-if="notesStore.loading" class="flex items-center justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-[32px] text-secondary">sync</span>
    </div>
    <div v-else-if="notesStore.error" class="text-center py-20 text-error">
      <p class="font-label-md">{{ notesStore.error }}</p>
    </div>
    <!-- Bento Grid Layout for Notes -->
    <div v-else class="grid grid-cols-12 gap-gutter">
      <!-- Standard Note Cards -->
      <div v-for="note in sortedActiveNotes" :key="note.id" 
           @click="openEditNoteModal(note)"
           :class="[
             'col-span-12 md:col-span-6 lg:col-span-4 group rounded-xl p-lg flex flex-col note-card transition-all duration-200 cursor-pointer relative border',
             note.pinned
               ? 'bg-secondary-container/55 border-secondary/55 shadow-md shadow-secondary/20 ring-1 ring-secondary/30 hover:bg-secondary-container/65 hover:border-secondary/70'
               : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
           ]">
        <div
          v-if="note.pinned"
          class="pointer-events-none absolute inset-y-3 left-0 w-1.5 rounded-full bg-secondary"
          aria-hidden="true"
        />

        <button 
          type="button"
          @click.stop="togglePin(note)" 
          class="absolute top-4 right-14 p-1.5 rounded-full transition-all duration-200 z-10"
          :class="note.pinned
            ? 'opacity-100 bg-secondary text-on-secondary shadow-sm hover:bg-secondary-fixed hover:opacity-95'
            : 'opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-secondary hover:bg-secondary-container/40'"
          :title="note.pinned ? 'Odepnij' : 'Przypnij'"
        >
          <span class="material-symbols-outlined text-[20px]" :style="note.pinned ? { fontVariationSettings: '\'FILL\' 1' } : undefined">push_pin</span>
        </button>
        <button 
          type="button"
          @click.stop="confirmArchiveNote(note)" 
          class="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:text-amber-700 hover:bg-amber-500/15 rounded-full transition-all duration-200 z-10"
          :class="note.pinned ? 'opacity-100 bg-surface-container-high/90' : 'opacity-0 group-hover:opacity-100'"
          title="Archiwizuj"
        >
          <span class="material-symbols-outlined text-[20px]">archive</span>
        </button>

        <div
          v-if="note.pinned"
          class="mb-sm flex items-center gap-1.5 self-start rounded-full bg-secondary/90 text-on-secondary px-2.5 py-1 font-label-sm text-label-sm shadow-sm"
        >
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1">push_pin</span>
          <span>Przypięta</span>
        </div>

        <div
          class="mb-md flex gap-sm"
          :class="note.pinned ? 'pr-[5.5rem]' : 'pr-10'"
          v-if="getJiraKeys(note.title).length > 0"
        >
          <span v-for="key in getJiraKeys(note.title)" :key="key" 
                class="font-label-md text-label-md px-2 py-0.5 rounded flex items-center gap-1"
                :class="getJiraStatusClass(key)">
            {{ key }}
            <span class="text-[10px] uppercase ml-1">{{ getJiraStatusText(key) }}</span>
          </span>
        </div>
        <div class="flex items-start gap-sm mb-sm pr-14 min-w-0">
          <h3
            class="font-headline-md text-headline-md flex-1 min-w-0"
            :class="note.pinned ? 'text-secondary' : 'text-on-surface'"
          >
            {{ cleanTitle(note.title) }}
          </h3>
        </div>
        <p class="font-body-sm text-body-sm line-clamp-2" :class="note.pinned ? 'text-on-secondary-container' : 'text-on-surface-variant'">
          Project: {{ note.projectId }}
        </p>
        <div
          v-if="visibleTagsOnCard(note).length > 0"
          class="mt-sm flex flex-wrap gap-1"
        >
          <button
            v-for="tag in visibleTagsOnCard(note).slice(0, 3)"
            :key="tag"
            type="button"
            @click.stop="toggleTagFilter(tag)"
            :class="['px-2 py-0.5 rounded-full text-[10px] font-label-sm border transition-colors', tagChipClass(tag, true)]"
            :title="`Filtruj po tagu ${tag}`"
          >
            {{ tag }}
          </button>
          <span
            v-if="visibleTagsOnCard(note).length > 3"
            class="px-1.5 py-0.5 text-[10px] font-label-sm text-on-surface-variant"
          >
            +{{ visibleTagsOnCard(note).length - 3 }}
          </span>
        </div>
        <div
          class="mt-md pt-md border-t flex items-center justify-between gap-sm font-body-sm text-body-sm"
          :class="note.pinned ? 'border-secondary/25 text-secondary' : 'border-outline-variant text-on-surface-variant'"
        >
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

      <!-- Archived notes -->
      <template v-if="showArchived && sortedArchivedNotes.length > 0">
        <div class="col-span-12 mt-lg pt-lg border-t border-outline-variant">
          <h2 class="font-headline-sm text-headline-sm text-on-surface-variant mb-md flex items-center gap-2">
            <span class="material-symbols-outlined text-[22px]">inventory_2</span>
            Archiwum
          </h2>
          <div class="grid grid-cols-12 gap-gutter">
            <div
              v-for="note in sortedArchivedNotes"
              :key="'archived-' + note.id"
              @click="openEditNoteModal(note)"
              class="col-span-12 md:col-span-6 lg:col-span-4 group bg-surface-container-high/40 border border-dashed border-outline-variant rounded-xl p-lg flex flex-col cursor-pointer relative hover:bg-surface-container-high/60 transition-all"
            >
              <div class="absolute top-4 right-4 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  @click.stop="restoreNote(note)"
                  class="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary-container/30 rounded-full"
                  title="Przywróć"
                >
                  <span class="material-symbols-outlined text-[20px]">unarchive</span>
                </button>
                <button
                  type="button"
                  @click.stop="confirmPermanentDelete(note)"
                  class="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full"
                  title="Usuń na stałe"
                >
                  <span class="material-symbols-outlined text-[20px]">delete_forever</span>
                </button>
              </div>
              <span class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded text-[11px] font-label-md uppercase tracking-wide bg-on-surface/10 text-on-surface-variant mb-sm">Zarchiwizowana</span>
              <h3 class="font-headline-md text-headline-md text-on-surface mb-sm pr-16">{{ cleanTitle(note.title) }}</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                Project: {{ note.projectId }}
              </p>
              <div class="mt-md pt-md border-t border-outline-variant/60 flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
                <span class="material-symbols-outlined text-[16px]">schedule</span>
                <span>{{ new Date(note.updatedAt).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Large Table-style note entry -->
      <div class="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-xl">
        <div class="p-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Recently Referenced Tasks</h3>
          <button class="text-secondary font-label-sm text-label-sm hover:underline">View All Tasks</button>
        </div>
        <div class="divide-y border-outline-variant">
          <div v-for="issue in referencedJiraTasks" :key="issue.key" class="p-md flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer border-outline-variant">
            <div class="flex items-center gap-md">
              <span class="font-label-md text-label-md text-secondary w-16">{{ issue.key }}</span>
              <div>
                <p class="font-body-md text-body-md text-on-surface">{{ issue.summary }}</p>
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
            <span class="text-body-sm text-on-surface-variant">Jira Issue</span>
          </div>
          <div v-if="referencedJiraTasks.length === 0" class="p-md text-center text-on-surface-variant font-body-sm">
            No Jira tasks referenced in current notes.
          </div>
        </div>
      </div>
    </div>

    <!-- Note Editor Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div class="bg-surface-container border border-outline-variant rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[85vh] overflow-hidden text-on-surface">
        <div class="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
          <div class="flex items-center gap-3 flex-1">
            <span class="material-symbols-outlined text-secondary">description</span>
            <input 
              v-model="activeNoteTitle" 
              placeholder="Untitled Note" 
              :disabled="!!activeNoteId"
              class="font-headline-md text-headline-md text-on-surface bg-transparent border-none outline-none flex-1 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-outline" 
            />
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="activeNoteId"
              type="button"
              @click="activeNotePinned = !activeNotePinned"
              class="p-2 rounded-full transition-colors"
              :class="activeNotePinned ? 'text-secondary bg-secondary-container/40' : 'text-on-surface-variant hover:bg-surface-container-highest'"
              :title="activeNotePinned ? 'Odepnij' : 'Przypnij'"
            >
              <span class="material-symbols-outlined text-[22px]" :style="activeNotePinned ? { fontVariationSettings: '\'FILL\' 1' } : undefined">push_pin</span>
            </button>
            <button type="button" @click="closeModal" class="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-highest transition-colors">
              <span class="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-hidden flex flex-col bg-surface-container">
          <!-- Tag editor -->
          <div class="px-4 py-2 border-b border-outline-variant bg-surface-container-low/60">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">sell</span>
              <span
                v-for="tag in activeNoteUserTags"
                :key="tag"
                class="px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-container/60 text-on-secondary-container border border-secondary-container flex items-center gap-1"
              >
                {{ tag }}
                <button
                  type="button"
                  @click="removeActiveTag(tag)"
                  class="hover:text-error transition-colors"
                  :title="`Usuń tag ${tag}`"
                >
                  <span class="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
              <div class="relative flex-1 min-w-[160px] flex gap-1">
                <input
                  v-model="tagInput"
                  type="text"
                  placeholder="Dodaj tag (Enter)..."
                  @keydown.enter.prevent="addTagFromInput"
                  @keydown.tab.prevent="addTagFromInput"
                  @keydown="onTagKeydown"
                  @focus="showTagSuggestions = true"
                  @blur="onTagInputBlur"
                  class="flex-1 px-2 py-1 bg-transparent border border-outline-variant rounded text-on-surface text-body-sm focus:outline-none focus:border-secondary"
                />
                <button
                  type="button"
                  @click="addTagFromInput"
                  :disabled="!tagInput.trim()"
                  class="px-2 py-1 rounded bg-secondary-container/40 text-on-surface hover:bg-secondary-container/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center"
                  title="Dodaj tag"
                >
                  <span class="material-symbols-outlined text-[18px]">add</span>
                </button>
                <div
                  v-if="showTagSuggestions && tagSuggestions.length > 0"
                  class="absolute z-20 left-0 right-0 top-full mt-1 bg-surface-container-high border border-outline-variant rounded shadow-lg max-h-48 overflow-y-auto"
                >
                  <button
                    v-for="s in tagSuggestions"
                    :key="s.slug"
                    type="button"
                    @mousedown.prevent="pickSuggestion(s.slug)"
                    class="w-full text-left px-3 py-1.5 hover:bg-surface-container-highest text-body-sm text-on-surface flex items-center justify-between"
                  >
                    <span>{{ s.slug }}</span>
                    <span class="text-on-surface-variant text-[11px]">{{ s.count }}</span>
                  </button>
                </div>
              </div>
            </div>
            <p v-if="tagInputError" class="mt-1 text-error text-label-sm font-label-sm">{{ tagInputError }}</p>
          </div>

          <!-- Obsidian-style Toolbar -->
          <div class="px-3 py-1 border-b border-outline-variant bg-surface-container-low flex flex-wrap gap-0.5 items-center">
            <template v-if="!isSourceMode">
              <button @mousedown.prevent @click="format('bold')" class="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Bold (Ctrl+B)">
                <span class="material-symbols-outlined text-[18px]">format_bold</span>
              </button>
              <button @mousedown.prevent @click="format('italic')" class="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Italic (Ctrl+I)">
                <span class="material-symbols-outlined text-[18px]">format_italic</span>
              </button>
              <div class="w-[1px] h-4 bg-outline-variant mx-1"></div>
              <button @mousedown.prevent @click="format('heading')" class="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Heading">
                <span class="material-symbols-outlined text-[18px]">title</span>
              </button>
              <button @mousedown.prevent @click="format('list')" class="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Bullet List">
                <span class="material-symbols-outlined text-[18px]">format_list_bulleted</span>
              </button>
              <button @mousedown.prevent @click="format('task')" class="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Task List">
                <span class="material-symbols-outlined text-[18px]">checklist</span>
              </button>
              <div class="w-[1px] h-4 bg-outline-variant mx-1"></div>
              <button @mousedown.prevent @click="format('link')" class="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-on-surface transition-colors" title="Link">
                <span class="material-symbols-outlined text-[18px]">link</span>
              </button>
            </template>
            <div v-else class="px-2 text-on-surface-variant text-[11px] uppercase tracking-wider font-bold">Source Mode</div>

            <div class="flex-1"></div>

            <button @click="isSourceMode = !isSourceMode" 
                    class="px-3 py-1 rounded flex items-center gap-1.5 transition-all duration-200"
                    :class="isSourceMode ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'">
              <span class="material-symbols-outlined text-[18px]">{{ isSourceMode ? 'code' : 'menu_book' }}</span>
              <span class="font-label-sm">{{ isSourceMode ? 'Source' : 'Live' }}</span>
            </button>
          </div>

          <!-- Editor Area -->
          <div class="flex-1 relative bg-surface-container flex flex-col overflow-hidden">
            <template v-if="!isSourceMode">
              <MilkdownWrapper
                v-if="isModalOpen"
                :modelValue="activeNoteBody"
                @update:modelValue="activeNoteBody = $event"
                @uploadAttachment="handleUploadAttachment"
              />
            </template>
            <template v-else>
              <textarea 
                ref="editorRef"
                v-model="activeNoteBody"
                class="flex-1 w-full p-6 outline-none whitespace-pre-wrap break-words font-mono text-[14px] leading-[1.6] text-on-surface caret-secondary bg-transparent resize-none overflow-y-auto" 
                spellcheck="false"
              ></textarea>
            </template>
          </div>
        </div>

        <div class="p-4 border-t border-outline-variant bg-surface-container-high flex justify-end gap-3">
          <button @click="closeModal" class="px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded font-label-md transition-colors">Cancel</button>
          <button @click="saveNote(true)" :disabled="saving" class="px-6 py-2 bg-secondary text-on-secondary rounded font-label-md hover:bg-secondary-fixed transition-all flex items-center gap-2 shadow-lg shadow-secondary/10">
            <span v-if="saving" class="material-symbols-outlined animate-spin text-[16px]">sync</span>
            {{ saving ? 'Saving...' : 'Save Note' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, nextTick, watch } from 'vue';
import type { NoteListItem, TagSummary } from '../types/api';
import { TAG_CATEGORY_CUSTOM, TAG_SLUG_REGEX } from '../types/api';
import { useNotesStore } from '../stores/notesStore';
import { useJiraStore } from '../stores/jiraStore';
import { useProjectsStore } from '../stores/projectsStore';
import { useTagsStore } from '../stores/tagsStore';
import { useRoute, useRouter } from 'vue-router';
import MilkdownWrapper from '../components/MilkdownWrapper.vue';

const notesStore = useNotesStore();
const jiraStore = useJiraStore();
const projectsStore = useProjectsStore();
const tagsStore = useTagsStore();
const route = useRoute();
const router = useRouter();

const isModalOpen = ref(false);
const activeNoteId = ref<string | null>(null);
const activeNoteTitle = ref('');
const activeNoteBody = ref('');
const editorRef = ref<HTMLTextAreaElement | null>(null);
const saving = ref(false);
const isSourceMode = ref(false);
const searchQuery = ref('');
const showArchived = ref(true);
const activeNotePinned = ref(false);
const activeNoteUserTags = ref<string[]>([]);
const tagInput = ref('');
const tagInputError = ref<string | null>(null);
const showTagSuggestions = ref(false);
const selectedTags = ref<Set<string>>(new Set());

function normalizeTagInput(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9/-]/g, '');
}

function isValidTagSlug(slug: string): boolean {
  return TAG_SLUG_REGEX.test(slug);
}

function toggleTagFilter(slug: string) {
  const next = new Set(selectedTags.value);
  if (next.has(slug)) {
    next.delete(slug);
  } else {
    next.add(slug);
  }
  selectedTags.value = next;
  syncQueryWithSelectedTags();
}

function clearTagFilter() {
  selectedTags.value = new Set();
  syncQueryWithSelectedTags();
}

function syncQueryWithSelectedTags() {
  const tags = Array.from(selectedTags.value);
  router.replace({
    query: {
      ...route.query,
      tag: tags.length === 0 ? undefined : tags,
    },
  });
}

function addTagFromInput() {
  tagInputError.value = null;
  const slug = normalizeTagInput(tagInput.value);
  if (!slug) {
    tagInput.value = '';
    return;
  }
  if (!isValidTagSlug(slug)) {
    tagInputError.value = 'Tag musi mieć format: małe litery, cyfry, "-" lub "/" (np. praca/spotkanie).';
    return;
  }
  if (activeNoteUserTags.value.includes(slug)) {
    tagInput.value = '';
    return;
  }
  activeNoteUserTags.value = [...activeNoteUserTags.value, slug];
  tagInput.value = '';
  showTagSuggestions.value = false;
}

function removeActiveTag(slug: string) {
  activeNoteUserTags.value = activeNoteUserTags.value.filter(t => t !== slug);
}

function pickSuggestion(slug: string) {
  tagInput.value = slug;
  addTagFromInput();
}

function onTagInputBlur() {
  window.setTimeout(() => {
    showTagSuggestions.value = false;
  }, 150);
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === ',') {
    e.preventDefault();
    addTagFromInput();
    return;
  }
  if (e.key === 'Backspace' && tagInput.value === '' && activeNoteUserTags.value.length > 0) {
    activeNoteUserTags.value = activeNoteUserTags.value.slice(0, -1);
  }
}

const tagSuggestions = computed<TagSummary[]>(() => {
  const q = normalizeTagInput(tagInput.value);
  const customTags = tagsStore.customTags;
  const filtered = q
    ? customTags.filter(t => t.slug.includes(q) && !activeNoteUserTags.value.includes(t.slug))
    : customTags.filter(t => !activeNoteUserTags.value.includes(t.slug));
  return filtered.slice(0, 8);
});

function noteMatchesSearch(note: NoteListItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return note.title.toLowerCase().includes(q) || (note.body?.toLowerCase().includes(q) ?? false);
}

function noteMatchesTagFilter(note: NoteListItem): boolean {
  if (selectedTags.value.size === 0) return true;
  const noteTags = note.tags ?? [];
  for (const t of selectedTags.value) {
    if (noteTags.includes(t)) return true;
  }
  return false;
}

function sortNotesForOverview(list: NoteListItem[]): NoteListItem[] {
  return [...list].sort((a, b) => {
    const ar = !!a.archived;
    const br = !!b.archived;
    if (ar !== br) return ar ? 1 : -1;
    if (!ar && !br && !!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

const sortedActiveNotes = computed(() => {
  const list = notesStore.notes.filter(
    n => !n.archived && noteMatchesSearch(n, searchQuery.value) && noteMatchesTagFilter(n),
  );
  return sortNotesForOverview(list);
});

const sortedArchivedNotes = computed(() => {
  const list = notesStore.notes.filter(
    n => !!n.archived && noteMatchesSearch(n, searchQuery.value) && noteMatchesTagFilter(n),
  );
  return sortNotesForOverview(list);
});

const archivedCount = computed(() => notesStore.notes.filter(n => !!n.archived).length);

const filterBarTags = computed<TagSummary[]>(() => {
  return [...tagsStore.tags].sort((a, b) => {
    if (a.category !== b.category) {
      if (a.category === TAG_CATEGORY_CUSTOM) return -1;
      if (b.category === TAG_CATEGORY_CUSTOM) return 1;
      return a.category.localeCompare(b.category);
    }
    return b.count - a.count;
  });
});

function tagChipClass(slug: string, isCustom: boolean): string {
  if (selectedTags.value.has(slug)) {
    return 'bg-secondary text-on-secondary border-secondary';
  }
  return isCustom
    ? 'bg-secondary-container/40 text-on-surface border-secondary-container hover:bg-secondary-container/60'
    : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:bg-surface-container-highest';
}

function openNewNoteModal() {
  activeNoteId.value = null;
  activeNoteTitle.value = '';
  activeNoteBody.value = '';
  activeNotePinned.value = false;
  activeNoteUserTags.value = [];
  tagInput.value = '';
  tagInputError.value = null;
  isModalOpen.value = true;
  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.focus();
    }
  });
}

async function openEditNoteModal(note: NoteListItem) {
  activeNoteId.value = note.id;
  activeNoteTitle.value = note.title;
  activeNoteBody.value = 'Loading...';
  activeNotePinned.value = !!note.pinned;
  activeNoteUserTags.value = (note.tags ?? []).filter(t => !isAutoTag(t));
  tagInput.value = '';
  tagInputError.value = null;
  isModalOpen.value = true;

  try {
    await notesStore.fetchNoteDetail(note.id);
    if (notesStore.currentNote) {
      activeNoteTitle.value = notesStore.currentNote.title;
      activeNoteBody.value = notesStore.currentNote.body || '';
      activeNotePinned.value = !!notesStore.currentNote.pinned;
      activeNoteUserTags.value = (notesStore.currentNote.tags ?? []).filter(t => !isAutoTag(t));
    }
  } catch (err) {
    console.error("Failed to load note detail", err);
    activeNoteBody.value = 'Error loading note.';
  }
}

function isAutoTag(slug: string): boolean {
  const prefix = slug.split('/')[0];
  return prefix === 'project' || prefix === 'type' || prefix === 'epic' ||
         prefix === 'status' || prefix === 'priority' || prefix === 'jira' ||
         prefix === 'area' || prefix === 'sprint';
}

function visibleTagsOnCard(note: NoteListItem): string[] {
  return (note.tags ?? []).filter(t => !isAutoTag(t));
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

async function handleUploadAttachment(
  file: File,
  resolve: (url: string) => void,
  reject: (err: unknown) => void,
) {
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

  if (tagInput.value.trim()) {
    addTagFromInput();
    if (tagInputError.value) {
      saving.value = false;
      return;
    }
  }

  saving.value = true;
  try {
    if (activeNoteId.value) {
      console.log("Updating existing note:", activeNoteId.value);
      await notesStore.updateNote(activeNoteId.value, activeNoteBody.value, activeNoteTitle.value, {
        pinned: activeNotePinned.value,
        userTags: [...activeNoteUserTags.value],
      });
    } else {
      console.log("Creating new note. Current projects:", projectsStore.projects);
      let project = projectsStore.projects.find(p => p.title === 'Scratchpad' || p.slug === 'scratchpad');
      if (!project) {
        console.log("Scratchpad project not found, creating one...");
        project = await projectsStore.createProject('Scratchpad', 'General notes and scratchpad');
      }
      console.log("Saving to project:", project.id);
      const newNote = await notesStore.createNote(
        project.id,
        activeNoteTitle.value,
        activeNoteBody.value,
        [...activeNoteUserTags.value],
      );
      activeNoteId.value = newNote.id;
    }
    await Promise.all([notesStore.fetchAllNotes(), tagsStore.fetchAll()]);
    if (close) {
      closeModal();
    }
  } catch (err) {
    console.error("Save note failed:", err);
    const message = err instanceof Error ? err.message : 'Failed to save note';
    alert(message);
  } finally {
    saving.value = false;
  }
}

async function togglePin(note: NoteListItem) {
  try {
    await notesStore.patchNoteMetadata(note.id, { pinned: !note.pinned });
  } catch (err) {
    console.error('togglePin failed:', err);
    alert('Nie udało się zmienić przypięcia.');
  }
}

async function confirmArchiveNote(note: NoteListItem) {
  if (
    !confirm(
      `Przenieść do archiwum notatkę „${cleanTitle(note.title)}”? Możesz ją później przywrócić lub usunąć na stałe.`,
    )
  ) {
    return;
  }
  try {
    await notesStore.patchNoteMetadata(note.id, { archived: true });
  } catch (err) {
    console.error('Archive note failed:', err);
    alert('Nie udało się zarchiwizować notatki.');
  }
}

async function restoreNote(note: NoteListItem) {
  try {
    await notesStore.patchNoteMetadata(note.id, { archived: false });
  } catch (err) {
    console.error('Restore note failed:', err);
    alert('Nie udało się przywrócić notatki.');
  }
}

async function confirmPermanentDelete(note: NoteListItem) {
  if (
    !confirm(
      `Na stałe usunąć „${cleanTitle(note.title)}”? Tej operacji nie można cofnąć.`,
    )
  ) {
    return;
  }
  try {
    await notesStore.deleteNote(note.id);
    if (activeNoteId.value === note.id) {
      closeModal();
    }
  } catch (err) {
    console.error('Delete note failed:', err);
    alert('Nie udało się usunąć notatki.');
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
    if (note.archived) return;
    getJiraKeys(note.title).forEach(k => keys.add(k));
  });
  return jiraStore.issues.filter(i => keys.has(i.key));
});

function applyTagQuery() {
  const raw = route.query.tag;
  if (raw === undefined || raw === null) {
    selectedTags.value = new Set();
    return;
  }
  const list = Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === 'string')
    : typeof raw === 'string'
      ? [raw]
      : [];
  selectedTags.value = new Set(list);
}

watch(() => route.query.tag, applyTagQuery);

onMounted(async () => {
  try {
    applyTagQuery();
    await Promise.all([
      projectsStore.fetchProjects(),
      notesStore.fetchAllNotes(),
      tagsStore.fetchAll(),
    ]);
    await notesStore.discoverJiraTasksInNotes(notesStore.notes.filter(n => !n.archived));

    if (route.query.openNote) {
      const noteToOpen = notesStore.notes.find((n: any) => n.id === route.query.openNote);
      if (noteToOpen) {
        openEditNoteModal(noteToOpen);
        const { openNote: _omit, ...rest } = route.query;
        void _omit;
        router.replace({ query: rest });
      }
    }
  } catch (err) {
    console.error("Failed to initialize NotesOverview:", err);
  }
});
</script>
