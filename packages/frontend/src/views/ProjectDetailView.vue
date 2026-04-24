<script setup lang="ts">
import axios, { isAxiosError } from 'axios';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type {
  JiraBoardListItem,
  JiraIssueDto,
  NoteDetail,
  NoteListItem,
  ProjectDto,
} from '../types/api';

const route = useRoute();
const projectId = computed(() => String(route.params.id));

const project = ref<ProjectDto | null>(null);
const notes = ref<NoteListItem[]>([]);
const selectedId = ref<string | null>(null);
const editTitle = ref('');
const editBody = ref('');
const error = ref<string | null>(null);
const saving = ref(false);

const jiraConfigured = ref(false);
/** false do momentu pierwszego zakończenia próby pobrania boardów (unikamy migania komunikatu). */
const jiraConfigChecked = ref(false);
const jiraBoards = ref<JiraBoardListItem[]>([]);
const jiraBoardId = ref<number | null>(null);
const jiraIssues = ref<JiraIssueDto[]>([]);
const jiraIssuesLoading = ref(false);
const jiraError = ref<string | null>(null);

const trackedIssues = ref<JiraIssueDto[]>([]);
const trackingLoading = ref(false);

function markdownForJiraIssue(i: JiraIssueDto): string {
  return `\n### [${i.key}] ${i.summary}\n\n- **Status:** ${i.status}\n- **Typ:** ${i.issueType}\n- **Priorytet:** ${i.priority}\n${i.assignee ? `- **Przypisany:** ${i.assignee}\n` : ''}\n`;
}

async function loadJiraBoards() {
  jiraError.value = null;
  try {
    const { data } = await axios.get<JiraBoardListItem[]>('/api/jira/boards');
    jiraBoards.value = data;
    jiraConfigured.value = true;
    const preferred = project.value?.jiraBoardId ?? null;
    if (preferred != null && data.some(b => b.id === preferred)) {
      jiraBoardId.value = preferred;
    } else if (data.length > 0) {
      jiraBoardId.value = data[0]!.id;
    } else {
      jiraBoardId.value = null;
    }
    await loadJiraIssues();
  } catch (e) {
    jiraIssues.value = [];
    if (isAxiosError(e) && e.response?.status === 503) {
      jiraConfigured.value = false;
      jiraBoards.value = [];
      jiraBoardId.value = null;
    } else {
      jiraError.value = e instanceof Error ? e.message : String(e);
    }
  } finally {
    jiraConfigChecked.value = true;
  }
}

async function loadJiraIssues() {
  if (jiraBoardId.value == null) {
    jiraIssues.value = [];
    return;
  }
  jiraIssuesLoading.value = true;
  jiraError.value = null;
  try {
    const { data } = await axios.get<JiraIssueDto[]>(
      `/api/jira/boards/${jiraBoardId.value}/issues`,
    );
    jiraIssues.value = data;
  } catch (e) {
    jiraIssues.value = [];
    jiraError.value = e instanceof Error ? e.message : String(e);
  } finally {
    jiraIssuesLoading.value = false;
  }
}

async function addJiraIssueToNotes(i: JiraIssueDto) {
  jiraError.value = null;
  const block = markdownForJiraIssue(i);
  try {
    if (selectedId.value) {
      editBody.value += block;
      await saveNote();
    } else {
      const { data } = await axios.post<NoteListItem>(`/api/projects/${projectId.value}/notes`, {
        title: `Jira — ${i.key}: ${i.summary}`,
        body: `## Treść\n\n${block}`,
      });
      await loadNotes();
      await selectNote(data.id);
    }
  } catch (e) {
    jiraError.value = e instanceof Error ? e.message : String(e);
  }
}

async function syncTrackedIssues() {
  if (!editBody.value || !jiraConfigured.value) {
    trackedIssues.value = [];
    return;
  }
  const keys = [...new Set(editBody.value.match(/[A-Z]+-[0-9]+/g) || [])];
  if (keys.length === 0) {
    trackedIssues.value = [];
    return;
  }
  trackingLoading.value = true;
  try {
    const { data } = await axios.post<JiraIssueDto[]>('/api/jira/issues/bulk', { keys });
    trackedIssues.value = data;
  } catch (e) {
    console.error('Failed to sync issues:', e);
  } finally {
    trackingLoading.value = false;
  }
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
watch(editBody, () => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(syncTrackedIssues, 1000);
});

async function loadProject() {
  const { data } = await axios.get<ProjectDto>(`/api/projects/${projectId.value}`);
  project.value = data;
}

async function loadNotes() {
  const { data } = await axios.get<NoteListItem[]>(`/api/projects/${projectId.value}/notes`);
  notes.value = data;
}

async function loadAll() {
  error.value = null;
  selectedId.value = null;
  editTitle.value = '';
  editBody.value = '';
  jiraConfigChecked.value = false;
  try {
    await loadProject();
    await loadNotes();
    await loadJiraBoards();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    project.value = null;
  }
}

async function selectNote(id: string) {
  selectedId.value = id;
  error.value = null;
  try {
    const { data } = await axios.get<NoteDetail>(`/api/notes/${id}`);
    editTitle.value = data.title;
    editBody.value = data.body;
    await syncTrackedIssues();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function saveNote() {
  if (!selectedId.value) return;
  saving.value = true;
  error.value = null;
  try {
    await axios.put(`/api/notes/${selectedId.value}`, {
      title: editTitle.value,
      body: editBody.value,
    });
    await loadNotes();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    saving.value = false;
  }
}

async function deleteNote() {
  if (!selectedId.value) return;
  if (!confirm('Usunąć tę notatkę?')) return;
  error.value = null;
  try {
    await axios.delete(`/api/notes/${selectedId.value}`);
    selectedId.value = null;
    editTitle.value = '';
    editBody.value = '';
    await loadNotes();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function addNote() {
  const title = prompt('Tytuł notatki');
  if (!title?.trim()) return;
  error.value = null;
  try {
    const { data } = await axios.post<NoteListItem>(`/api/projects/${projectId.value}/notes`, {
      title: title.trim(),
      body: '## Treść\n\n',
    });
    await loadNotes();
    await selectNote(data.id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(loadAll);
watch(projectId, loadAll);
</script>

<template>
  <main class="page">
    <p>
      <router-link to="/" class="back">← Projekty</router-link>
    </p>

    <template v-if="project">
      <header class="head">
        <h1>{{ project.title }}</h1>
        <span v-if="project.source === 'local'" class="badge">Tylko lokalnie (bez Jiry)</span>
        <span v-else class="badge badge-jira">Powiązany z Jirą</span>
      </header>
      <p v-if="project.description" class="desc">{{ project.description }}</p>
    </template>

    <p v-if="error" class="err">{{ error }}</p>

    <section v-if="project" class="jira-panel">
      <h2>Taski z boarda Jiry</h2>
      <p v-if="!jiraConfigChecked" class="muted">Sprawdzanie konfiguracji Jiry…</p>
      <template v-else-if="!jiraConfigured">
        <p class="jira-unconfigured">
          Jira nie jest skonfigurowana. Uzupełnij w katalogu danych vaultu plik
          <code>config.json</code> pola <code>jira.baseUrl</code>, <code>jira.email</code> i
          <code>jira.token</code> (token API), potem uruchom ponownie backend.
        </p>
      </template>
      <template v-else>
        <p class="jira-hint">
          Wybierz board, potem task — zostanie dopisany do otwartej notatki albo utworzona zostanie
          nowa.
        </p>
        <p v-if="jiraBoards.length === 0" class="muted">Brak boardów widocznych dla konta Jiry.</p>
        <label v-else class="jira-board-label">
          Board
          <select v-model.number="jiraBoardId" class="jira-select" @change="loadJiraIssues">
            <option v-for="b in jiraBoards" :key="b.id" :value="b.id">
              {{ b.name }} ({{ b.id }})
            </option>
          </select>
        </label>
        <p v-if="jiraError" class="err">{{ jiraError }}</p>
        <p v-if="jiraIssuesLoading" class="muted">Ładowanie tasków…</p>
        <ul v-else-if="jiraBoardId != null" class="jira-projects">
          <li v-for="ji in jiraIssues" :key="ji.id">
            <div class="jira-issue-info">
              <span class="jira-proj-meta"><strong>{{ ji.key }}</strong>: {{ ji.summary }}</span>
              <div class="jira-issue-details">
                <span class="badge">{{ ji.status }}</span>
                <span class="badge badge-priority">{{ ji.priority }}</span>
              </div>
            </div>
            <button type="button" class="btn-jira-add" @click="addJiraIssueToNotes(ji)">
              Do notatki
            </button>
          </li>
        </ul>
        <p
          v-if="!jiraIssuesLoading && jiraBoardId != null && jiraIssues.length === 0"
          class="muted"
        >
          Brak tasków na tym boardzie.
        </p>
      </template>
    </section>

    <section v-if="project" class="layout">
      <div class="col">
        <h2>Notatki</h2>
        <button type="button" class="btn-secondary" @click="addNote">Dodaj notatkę</button>
        <ul class="notes">
          <li v-for="n in notes" :key="n.id">
            <button
              type="button"
              class="note-btn"
              :class="{ active: n.id === selectedId }"
              @click="selectNote(n.id)"
            >
              {{ n.title }}
            </button>
          </li>
        </ul>
        <p v-if="notes.length === 0" class="muted">Brak notatek.</p>
      </div>
      <div v-if="selectedId" class="col editor">
        <h2>Edycja</h2>

        <div v-if="trackedIssues.length > 0" class="tracking-panel">
          <header class="tracking-head">
            <h3>Live Status Jiry</h3>
            <span v-if="trackingLoading" class="mini-spinner">…</span>
          </header>
          <div class="tracking-grid">
            <div v-for="ti in trackedIssues" :key="ti.key" class="track-item">
              <span class="track-key">{{ ti.key }}</span>
              <span class="track-status" :class="ti.status.toLowerCase().replace(/\s+/g, '-')">{{
                ti.status
              }}</span>
            </div>
          </div>
        </div>

        <label>
          Tytuł
          <input v-model="editTitle" type="text" />
        </label>
        <label>
          Treść (Markdown)
          <textarea v-model="editBody" rows="16" />
        </label>
        <div class="actions">
          <button type="button" :disabled="saving" @click="saveNote">Zapisz</button>
          <button type="button" class="btn-danger" @click="deleteNote">Usuń</button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: 1.5rem;
  font-family: system-ui, sans-serif;
  max-width: 56rem;
}
.back {
  color: #185fa5;
  text-decoration: none;
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
h1 {
  font-size: 1.35rem;
  margin: 0;
}
h2 {
  font-size: 1rem;
}
.badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: #f1efe8;
  color: #5f5e5a;
}
.badge-jira {
  background: #e6f1fb;
  color: #185fa5;
}
.desc {
  color: #444;
}
.jira-panel {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}
.jira-panel h2 {
  margin-top: 0;
}
.jira-unconfigured {
  font-size: 0.875rem;
  color: #444;
  margin: 0.25rem 0 0;
  line-height: 1.5;
}
.jira-unconfigured code {
  font-size: 0.8125rem;
  padding: 0.1rem 0.35rem;
  background: #eee;
  border-radius: 3px;
}
.jira-hint {
  font-size: 0.875rem;
  color: #555;
  margin: 0.25rem 0 0.75rem;
}
.jira-board-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  max-width: 28rem;
}
.jira-select {
  padding: 0.4rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}
.jira-projects {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.jira-projects li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  justify-content: space-between;
  padding: 0.35rem 0.5rem;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}
.jira-proj-meta {
  font-size: 0.875rem;
  flex: 1;
}
.jira-issue-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}
.jira-issue-details {
  display: flex;
  gap: 0.4rem;
}
.badge-priority {
  background: #fff0f0;
  color: #a32d2d;
  border: 1px solid #ffcccc;
}
.btn-jira-add {
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  background: #2d6a4f;
  align-self: center;
}
.err {
  color: #a32d2d;
}
.muted {
  color: #777;
}
.layout {
  display: grid;
  grid-template-columns: 14rem 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}
@media (max-width: 40rem) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.notes {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}
.note-btn {
  width: 100%;
  text-align: left;
  padding: 0.4rem 0.5rem;
  margin-bottom: 0.25rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.note-btn:hover {
  border-color: #ccc;
}
.note-btn.active {
  border-color: #185fa5;
  background: #f0f6fc;
}
.editor label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}
input,
textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  background: #185fa5;
  color: #fff;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
}
.btn-secondary {
  background: #5f5e5a;
  margin-bottom: 0.5rem;
}
.btn-danger {
  background: #a32d2d;
}

.tracking-panel {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f0f4f8;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
}
.tracking-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.tracking-head h3 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #555;
  letter-spacing: 0.05em;
}
.tracking-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.track-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.5rem;
  background: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  font-size: 0.75rem;
}
.track-key {
  font-weight: bold;
  color: #185fa5;
}
.track-status {
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  background: #eee;
  font-size: 0.7rem;
}
.track-status.to-do { background: #dfe1e6; color: #42526e; }
.track-status.in-progress { background: #deebff; color: #0747a6; }
.track-status.done { background: #e3fcef; color: #006644; }

.mini-spinner {
  font-size: 0.75rem;
  color: #185fa5;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
</style>
