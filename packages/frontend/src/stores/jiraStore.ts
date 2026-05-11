import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { JiraIssueDto, JiraSprintScopeDto } from '../types/api';
import { api, getApiErrorMessage } from '../api/client';

export const useJiraStore = defineStore('jira', () => {
  const defaultBoardId = ref<number | null>(null);
  const boardName = ref<string>('Loading...');
  const activeMode = ref<'production' | 'test'>('production');
  const issues = ref<JiraIssueDto[]>([]);
  const boards = ref<{ id: number; name: string }[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const sprintScope = ref<JiraSprintScopeDto | null>(null);

  async function fetchConfig() {
    try {
      const response = await api.get<{ defaultBoardId: number; activeMode: 'production' | 'test' }>(
        '/jira/config',
      );
      defaultBoardId.value = response.data.defaultBoardId;
      activeMode.value = response.data.activeMode;

      if (defaultBoardId.value) {
        await fetchBoardName(defaultBoardId.value);
      }
    } catch (err: unknown) {
      console.error('Error fetching Jira config:', err);
    }
  }

  async function fetchBoardName(id: number) {
    try {
      const response = await api.get<{ id: number; name: string }[]>('/jira/boards');
      boards.value = response.data;
      const board = response.data.find(b => b.id === id);
      if (board) {
        boardName.value = board.name;
      } else {
        boardName.value = `Board #${id}`;
      }
    } catch (err: unknown) {
      console.error('Error fetching board name:', err);
      boardName.value = `Board #${id}`;
    }
  }

  async function fetchSprintScope(boardId?: number) {
    const id = boardId || defaultBoardId.value;
    if (!id) {
      sprintScope.value = null;
      return;
    }
    try {
      const { data } = await api.get<JiraSprintScopeDto>(`/jira/boards/${id}/sprint-scope`);
      sprintScope.value = data;
    } catch (err: unknown) {
      console.error('Error fetching sprint scope:', err);
      sprintScope.value = null;
    }
  }

  async function fetchIssuesForBoard(boardId?: number, activeSprintOnly = true) {
    const id = boardId || defaultBoardId.value;
    if (!id) return;

    loading.value = true;
    error.value = null;
    try {
      const [issuesResponse] = await Promise.all([
        api.get<JiraIssueDto[]>(`/jira/boards/${id}/issues`, {
          params: { activeSprintOnly },
        }),
        fetchSprintScope(id),
      ]);
      issues.value = issuesResponse.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to fetch issues');
      console.error('Error fetching Jira issues:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIssuesByKeys(keys: string[]) {
    if (keys.length === 0) return [];

    try {
      const response = await api.post<JiraIssueDto[]>('/jira/issues/bulk', { keys });

      const newIssues = response.data;
      const issueMap = new Map(issues.value.map(i => [i.key, i]));
      newIssues.forEach(ni => issueMap.set(ni.key, ni));
      issues.value = Array.from(issueMap.values());

      return newIssues;
    } catch (err: unknown) {
      console.error('Error fetching bulk Jira issues:', err);
      return [];
    }
  }

  async function updateConfig(newBoardId: number) {
    try {
      const response = await api.patch<{ defaultBoardId: number }>('/jira/config', {
        defaultBoardId: newBoardId,
      });
      defaultBoardId.value = response.data.defaultBoardId;
      return true;
    } catch (err: unknown) {
      console.error('Error updating Jira config:', err);
      return false;
    }
  }

  return {
    issues,
    defaultBoardId,
    boardName,
    activeMode,
    boards,
    loading,
    error,
    sprintScope,
    fetchConfig,
    fetchIssuesForBoard,
    fetchSprintScope,
    fetchIssuesByKeys,
    updateConfig,
  };
});
