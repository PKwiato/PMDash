import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, getApiErrorMessage } from '../api/client';
import type { PrStatsDto } from '../types/api';

export const useGithubStore = defineStore('github', () => {
  const stats = ref<PrStatsDto | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPrStats(dateFrom: string, dateTo: string, owner = 'statscore', repo = 'marketplace') {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<PrStatsDto>('/github/pr-stats', {
        params: { owner, repo, dateFrom, dateTo },
      });
      stats.value = data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to fetch PR statistics');
      stats.value = null;
    } finally {
      loading.value = false;
    }
  }

  return { stats, loading, error, fetchPrStats };
});
