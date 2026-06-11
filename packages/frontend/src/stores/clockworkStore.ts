import { defineStore } from 'pinia';
import { api, getApiErrorMessage } from '../api/client';

export interface JiraUser {
  accountId: string;
  displayName: string;
  avatarUrl?: string;
}

export interface WorklogInconsistency {
  type: 'missing_hours' | 'overtime' | 'weekend_work' | 'overlap';
  date: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface IssueWorklogBreakdown {
  issueKey: string;
  seconds: number;
  logCount: number;
}

export interface UserAnalysis {
  user: JiraUser;
  totalSeconds: number;
  inconsistencies: WorklogInconsistency[];
  issueBreakdown: IssueWorklogBreakdown[];
}

export const useClockworkStore = defineStore('clockwork', {
  state: () => ({
    analysis: [] as UserAnalysis[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAnalysis(boardId: number, dateFrom: string, dateTo: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get<UserAnalysis[]>('/clockwork/analysis', {
          params: { boardId, dateFrom, dateTo },
        });
        this.analysis = response.data;
      } catch (err: unknown) {
        this.error = getApiErrorMessage(err, 'Failed to fetch analysis');
        console.error('Error fetching clockwork analysis:', err);
      } finally {
        this.loading = false;
      }
    },
  },
});
