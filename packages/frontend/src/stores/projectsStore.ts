import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ProjectDto } from '../types/api';
import { api, getApiErrorMessage } from '../api/client';

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<ProjectDto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<ProjectDto[]>('/projects');
      projects.value = response.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createProject(title: string, description?: string, jiraProjectKey?: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<ProjectDto>('/projects', { title, description, jiraProjectKey });
      projects.value.push(response.data);
      return response.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to create project');
      console.error('Error creating project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
  };
});
