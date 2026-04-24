import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import type { NoteListItem, NoteDetail } from '../types/api';
import { useJiraStore } from './jiraStore';

const API_BASE = '/api';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<NoteListItem[]>([]);
  const currentNote = ref<NoteDetail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const jiraStore = useJiraStore();

  async function fetchAllNotes() {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.get<NoteListItem[]>(`${API_BASE}/notes`);
      notes.value = response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch notes';
      console.error('Error fetching notes:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchNoteDetail(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.get<NoteDetail>(`${API_BASE}/notes/${id}`);
      currentNote.value = response.data;
      
      // Auto-discover Jira keys in note body and fetch their live status
      if (currentNote.value.body) {
        const regex = /[A-Z]+-\d+/g;
        const matches = currentNote.value.body.match(regex);
        if (matches && matches.length > 0) {
          // unique matches
          const uniqueKeys = Array.from(new Set(matches));
          await jiraStore.fetchIssuesByKeys(uniqueKeys);
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch note detail';
      console.error('Error fetching note details:', err);
    } finally {
      loading.value = false;
    }
  }

  // Also an action to discover and fetch Jira tasks mentioned across a list of notes
  async function discoverJiraTasksInNotes(notesList: { title: string, body?: string }[]) {
    const keys = new Set<string>();
    const regex = /[A-Z]+-\d+/g;
    
    notesList.forEach(note => {
      const titleMatches = note.title.match(regex);
      if (titleMatches) titleMatches.forEach(k => keys.add(k));
      
      if (note.body) {
        const bodyMatches = note.body.match(regex);
        if (bodyMatches) bodyMatches.forEach(k => keys.add(k));
      }
    });

    if (keys.size > 0) {
      await jiraStore.fetchIssuesByKeys(Array.from(keys));
    }
  }

  async function fetchNoteByJiraKey(key: string) {
    loading.value = true;
    error.value = null;
    try {
      // Find note that mentions this key in title
      const foundNote = notes.value.find(n => n.title.includes(key));
      if (foundNote) {
        await fetchNoteDetail(foundNote.id);
      } else {
        currentNote.value = null;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to find note';
    } finally {
      loading.value = false;
    }
  }

  async function createNote(projectId: string, title: string, body: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.post<NoteDetail>(`${API_BASE}/projects/${projectId}/notes`, { title, body });
      currentNote.value = response.data;
      // Refresh list
      await fetchAllNotes();
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create note';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateNote(id: string, body: string, title?: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.put<NoteDetail>(`${API_BASE}/notes/${id}`, { title, body });
      currentNote.value = response.data;
      // Update in list as well
      const idx = notes.value.findIndex(n => n.id === id);
      if (idx !== -1) {
        notes.value[idx] = { ...notes.value[idx], ...response.data };
      }
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update note';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    notes,
    currentNote,
    loading,
    error,
    fetchAllNotes,
    fetchNoteDetail,
    fetchNoteByJiraKey,
    createNote,
    updateNote,
    discoverJiraTasksInNotes
  };
});
