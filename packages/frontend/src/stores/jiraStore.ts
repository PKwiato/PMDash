import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import type { JiraIssueDto } from '../types/api';

const API_BASE = '/api/jira';

export const useJiraStore = defineStore('jira', () => {
  const issues = ref<JiraIssueDto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchIssuesForBoard(boardId: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.get<JiraIssueDto[]>(`${API_BASE}/boards/${boardId}/issues`);
      issues.value = response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch issues';
      console.error('Error fetching Jira issues:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIssuesByKeys(keys: string[]) {
    if (keys.length === 0) return [];
    
    try {
      const response = await axios.post<JiraIssueDto[]>(`${API_BASE}/issues/bulk`, { keys });
      
      // Update existing issues or add new ones
      const newIssues = response.data;
      const issueMap = new Map(issues.value.map(i => [i.key, i]));
      newIssues.forEach(ni => issueMap.set(ni.key, ni));
      issues.value = Array.from(issueMap.values());
      
      return newIssues;
    } catch (err) {
      console.error('Error fetching bulk Jira issues:', err);
      return [];
    }
  }

  return {
    issues,
    loading,
    error,
    fetchIssuesForBoard,
    fetchIssuesByKeys
  };
});
