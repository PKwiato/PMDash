import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { NoteDetail, NoteListItem } from '../types/api';
import { api, getApiErrorMessage } from '../api/client';
import { collectJiraKeysFromNotes, uniqueJiraKeysFromString } from '../utils/jiraKeys';
import { useJiraStore } from './jiraStore';

export interface NoteTask {
  noteId: string;
  noteTitle: string;
  text: string;
  completed: boolean;
  line: number;
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<NoteListItem[]>([]);
  const currentNote = ref<NoteDetail | null>(null);
  const noteTasks = ref<NoteTask[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const jiraStore = useJiraStore();

  async function fetchAllNotes() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<NoteListItem[]>('/notes');
      notes.value = response.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to fetch notes');
      console.error('Error fetching notes:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchNoteDetail(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<NoteDetail>(`/notes/${id}`);
      currentNote.value = response.data;

      if (currentNote.value.body) {
        const uniqueKeys = uniqueJiraKeysFromString(currentNote.value.body);
        if (uniqueKeys.length > 0) {
          await jiraStore.fetchIssuesByKeys(uniqueKeys);
        }
      }
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to fetch note detail');
      console.error('Error fetching note details:', err);
    } finally {
      loading.value = false;
    }
  }

  async function discoverJiraTasksInNotes(notesList: { title: string; body?: string }[]) {
    const keys = collectJiraKeysFromNotes(notesList);
    if (keys.length > 0) {
      await jiraStore.fetchIssuesByKeys(keys);
    }
  }

  async function fetchNoteByJiraKey(key: string) {
    loading.value = true;
    error.value = null;
    try {
      const foundNote = notes.value.find(n => n.title.includes(key));
      if (foundNote) {
        await fetchNoteDetail(foundNote.id);
      } else {
        currentNote.value = null;
      }
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to find note');
    } finally {
      loading.value = false;
    }
  }

  async function createNote(projectId: string, title: string, body: string, userTags?: string[]) {
    loading.value = true;
    error.value = null;
    try {
      const payload: Record<string, unknown> = { title, body };
      if (userTags !== undefined) payload.userTags = userTags;
      const response = await api.post<NoteDetail>(`/projects/${projectId}/notes`, payload);
      currentNote.value = response.data;
      await fetchAllNotes();
      return response.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to create note');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateNote(
    id: string,
    body: string,
    title?: string,
    opts?: { pinned?: boolean; archived?: boolean; userTags?: string[] },
  ) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put<NoteDetail>(`/notes/${id}`, { title, body, ...opts });
      currentNote.value = response.data;
      const idx = notes.value.findIndex(n => n.id === id);
      if (idx !== -1) {
        notes.value[idx] = { ...notes.value[idx], ...response.data };
      }
      return response.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to update note');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /** Pin/archive flags via PUT (PATCH is not always routed). */
  async function patchNoteMetadata(id: string, patch: { pinned?: boolean; archived?: boolean }) {
    error.value = null;
    try {
      const cached = notes.value.find(n => n.id === id);
      let body = cached?.body;
      let title = cached?.title;
      if (typeof body !== 'string') {
        const detailResp = await api.get<NoteDetail>(`/notes/${id}`);
        body = detailResp.data.body;
        title = detailResp.data.title;
      }
      const response = await api.put<NoteDetail>(`/notes/${id}`, { body, title, ...patch });
      const idx = notes.value.findIndex(n => n.id === id);
      if (idx !== -1) {
        notes.value[idx] = { ...notes.value[idx], ...response.data };
      }
      if (currentNote.value?.id === id) {
        currentNote.value = response.data;
      }
      return response.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to update note');
      throw err;
    }
  }

  async function deleteNote(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/notes/${id}`);
      notes.value = notes.value.filter(n => n.id !== id);
      if (currentNote.value?.id === id) {
        currentNote.value = null;
      }
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to delete note');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAllNoteTasks() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<NoteTask[]>('/notes/tasks');
      noteTasks.value = response.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to fetch note tasks');
    } finally {
      loading.value = false;
    }
  }

  async function uploadAttachment(noteId: string, file: File): Promise<string> {
    loading.value = true;
    error.value = null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<{ url: string }>(`/notes/${noteId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.url;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to upload attachment');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    notes,
    currentNote,
    noteTasks,
    loading,
    error,
    fetchAllNotes,
    fetchNoteDetail,
    fetchAllNoteTasks,
    fetchNoteByJiraKey,
    createNote,
    updateNote,
    patchNoteMetadata,
    deleteNote,
    uploadAttachment,
    discoverJiraTasksInNotes,
  };
});
