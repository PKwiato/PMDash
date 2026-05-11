<template>
  <div class="p-lg max-w-[1400px] mx-auto">
    <header class="flex justify-between items-end mb-xl">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-on-surface">Tagi</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-xs">
          Zarządzaj tagami przypiętymi do notatek. Tagi własne możesz przemianować lub usunąć — operacja przepisze pasujące pliki Markdown w vaulcie.
        </p>
      </div>
      <button
        @click="refresh"
        class="px-md py-2 border border-outline-variant text-on-surface-variant rounded flex items-center gap-2 hover:bg-surface-container transition-colors"
      >
        <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': tagsStore.loading }">refresh</span>
        <span class="font-label-md text-label-md">Odśwież</span>
      </button>
    </header>

    <div v-if="tagsStore.loading && tagsStore.tags.length === 0" class="flex items-center justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-[32px] text-secondary">sync</span>
    </div>

    <div v-else-if="tagsStore.error" class="text-center py-20 text-error">
      <p class="font-label-md">{{ tagsStore.error }}</p>
    </div>

    <div v-else>
      <!-- Custom tags -->
      <section class="mb-xl">
        <div class="flex items-center justify-between mb-md">
          <h2 class="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-[24px] text-secondary">sell</span>
            Tagi własne
          </h2>
          <span class="text-on-surface-variant font-label-sm">{{ tagsStore.customTags.length }}</span>
        </div>

        <div v-if="tagsStore.customTags.length === 0" class="p-xl bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-[40px] block mb-2">label_off</span>
          <p class="font-body-md mb-1">Brak własnych tagów</p>
          <p class="font-body-sm">Otwórz dowolną notatkę i dodaj tag, aby pojawił się tutaj.</p>
        </div>

        <div v-else class="grid grid-cols-12 gap-gutter">
          <div
            v-for="t in tagsStore.customTags"
            :key="t.slug"
            class="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-sm"
          >
            <div v-if="renameTarget === t.slug" class="flex flex-col gap-2">
              <label class="font-label-sm text-on-surface-variant">Nowa nazwa tagu</label>
              <input
                v-model="renameValue"
                @keydown.enter.prevent="confirmRename(t.slug)"
                @keydown.escape="cancelRename"
                type="text"
                class="px-2 py-1 bg-surface-container border border-outline-variant rounded text-on-surface focus:outline-none focus:border-secondary"
              />
              <p v-if="renameError" class="text-error text-label-sm font-label-sm">{{ renameError }}</p>
              <div class="flex justify-end gap-2 mt-1">
                <button
                  @click="cancelRename"
                  class="px-3 py-1 text-on-surface-variant hover:text-on-surface rounded font-label-sm"
                >Anuluj</button>
                <button
                  @click="confirmRename(t.slug)"
                  :disabled="renameSubmitting"
                  class="px-3 py-1 bg-secondary text-on-secondary rounded font-label-sm hover:bg-secondary-fixed disabled:opacity-50"
                >Zmień</button>
              </div>
            </div>

            <template v-else>
              <div class="flex items-center justify-between gap-2">
                <router-link
                  :to="{ name: 'notes-overview', query: { tag: t.slug } }"
                  class="px-2.5 py-1 rounded-full text-label-sm font-label-sm border bg-secondary-container/50 text-on-secondary-container border-secondary-container hover:bg-secondary-container/70 transition-colors truncate max-w-full"
                  :title="`Filtruj notatki po tagu ${t.slug}`"
                >{{ t.slug }}</router-link>
                <span class="text-on-surface-variant text-label-sm whitespace-nowrap">{{ t.count }} notatek</span>
              </div>
              <p class="text-on-surface-variant text-body-sm">Etykieta: {{ t.label }}</p>
              <div class="mt-auto flex justify-end gap-1">
                <button
                  @click="startRename(t)"
                  class="px-2 py-1 text-on-surface-variant hover:text-secondary hover:bg-secondary-container/30 rounded flex items-center gap-1 font-label-sm"
                  title="Zmień nazwę"
                >
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                  Rename
                </button>
                <button
                  @click="askDelete(t)"
                  class="px-2 py-1 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded flex items-center gap-1 font-label-sm"
                  title="Usuń tag z wszystkich notatek"
                >
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                  Usuń
                </button>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- Auto tags -->
      <section v-if="tagsStore.autoTags.length > 0">
        <div class="flex items-center justify-between mb-md">
          <h2 class="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-[24px] text-on-surface-variant">auto_awesome</span>
            Auto-tagi
          </h2>
          <span class="text-on-surface-variant font-label-sm">{{ tagsStore.autoTags.length }}</span>
        </div>
        <p class="text-on-surface-variant font-body-sm mb-md">
          Tagi systemowe (kategorie: <code>project/</code>, <code>type/</code>, <code>status/</code>, …) są generowane automatycznie i nie podlegają edycji. Możesz po nich filtrować notatki.
        </p>

        <div class="flex flex-wrap gap-2">
          <router-link
            v-for="t in tagsStore.autoTags"
            :key="t.slug"
            :to="{ name: 'notes-overview', query: { tag: t.slug } }"
            class="px-3 py-1 rounded-full text-label-sm font-label-sm border bg-surface-container-high text-on-surface-variant border-outline-variant hover:bg-surface-container-highest transition-colors flex items-center gap-2"
            :title="`Filtruj notatki po tagu ${t.slug}`"
          >
            <span>{{ t.slug }}</span>
            <span class="text-[10px] opacity-70">{{ t.count }}</span>
          </router-link>
        </div>
      </section>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div class="bg-surface-container border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-lg flex flex-col gap-md">
        <h3 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-error">warning</span>
          Usunąć tag „{{ deleteTarget.slug }}”?
        </h3>
        <p class="font-body-md text-on-surface-variant">
          Tag zostanie usunięty z wszystkich {{ deleteTarget.count }} notatek, w których występuje. Operacja przepisze pliki <code>.md</code> w vaulcie i nie może być cofnięta.
        </p>
        <p v-if="deleteError" class="text-error font-body-sm">{{ deleteError }}</p>
        <div class="flex justify-end gap-2">
          <button
            @click="deleteTarget = null; deleteError = null"
            class="px-4 py-2 text-on-surface-variant hover:text-on-surface rounded font-label-md"
            :disabled="deleteSubmitting"
          >Anuluj</button>
          <button
            @click="confirmDelete"
            :disabled="deleteSubmitting"
            class="px-4 py-2 bg-error text-on-error rounded font-label-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <span v-if="deleteSubmitting" class="material-symbols-outlined animate-spin text-[16px]">sync</span>
            Usuń tag
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useTagsStore } from '../stores/tagsStore';
import { useNotesStore } from '../stores/notesStore';
import { TAG_SLUG_REGEX, type TagSummary } from '../types/api';

const tagsStore = useTagsStore();
const notesStore = useNotesStore();

const renameTarget = ref<string | null>(null);
const renameValue = ref('');
const renameError = ref<string | null>(null);
const renameSubmitting = ref(false);

const deleteTarget = ref<TagSummary | null>(null);
const deleteError = ref<string | null>(null);
const deleteSubmitting = ref(false);

function startRename(t: TagSummary) {
  renameTarget.value = t.slug;
  renameValue.value = t.slug;
  renameError.value = null;
}

function cancelRename() {
  renameTarget.value = null;
  renameValue.value = '';
  renameError.value = null;
}

function normalizeSlug(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9/-]/g, '');
}

async function confirmRename(oldSlug: string) {
  renameError.value = null;
  const newSlug = normalizeSlug(renameValue.value);
  if (!newSlug) {
    renameError.value = 'Nazwa tagu nie może być pusta.';
    return;
  }
  if (!TAG_SLUG_REGEX.test(newSlug)) {
    renameError.value = 'Nieprawidłowy format. Dozwolone: małe litery, cyfry, "-", "/".';
    return;
  }
  if (newSlug === oldSlug) {
    cancelRename();
    return;
  }
  renameSubmitting.value = true;
  try {
    await tagsStore.rename(oldSlug, newSlug);
    await notesStore.fetchAllNotes();
    cancelRename();
  } catch (err: unknown) {
    renameError.value = err instanceof Error ? err.message : 'Nie udało się zmienić nazwy tagu.';
  } finally {
    renameSubmitting.value = false;
  }
}

function askDelete(t: TagSummary) {
  deleteTarget.value = t;
  deleteError.value = null;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  deleteSubmitting.value = true;
  deleteError.value = null;
  try {
    await tagsStore.remove(deleteTarget.value.slug);
    await notesStore.fetchAllNotes();
    deleteTarget.value = null;
  } catch (err: unknown) {
    deleteError.value = err instanceof Error ? err.message : 'Nie udało się usunąć tagu.';
  } finally {
    deleteSubmitting.value = false;
  }
}

async function refresh() {
  await tagsStore.fetchAll();
}

onMounted(async () => {
  await tagsStore.fetchAll();
});
</script>
