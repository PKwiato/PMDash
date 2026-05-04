import { defineStore } from 'pinia';
import axios from 'axios';

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

export interface UserAnalysis {
  user: JiraUser;
  totalSeconds: number;
  inconsistencies: WorklogInconsistency[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
        const response = await axios.get(`${API_BASE}/clockwork/analysis`, {
          params: { boardId, dateFrom, dateTo }
        });
        this.analysis = response.data;
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Failed to fetch analysis';
        console.error('Error fetching clockwork analysis:', err);
      } finally {
        this.loading = false;
      }
    },
  },
});
