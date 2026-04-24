import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import type { ProjectDto } from '../types/api';

const API_BASE = '/api/projects';

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<ProjectDto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.get<ProjectDto[]>(API_BASE);
      projects.value = response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch projects';
      console.error('Error fetching projects:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjects
  };
});
