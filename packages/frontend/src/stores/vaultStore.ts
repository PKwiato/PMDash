import { defineStore } from 'pinia';
import { api, getApiErrorMessage } from '../api/client';

export interface VaultSettings {
  productionDir: string;
  testDir: string;
  activeMode: 'production' | 'test';
}

export const useVaultStore = defineStore('vault', {
  state: () => ({
    productionDir: '',
    testDir: '',
    activeMode: 'test' as 'production' | 'test',
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchSettings() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get<VaultSettings>('/vault/settings');
        this.productionDir = response.data.productionDir;
        this.testDir = response.data.testDir;
        this.activeMode = response.data.activeMode;
      } catch (err: unknown) {
        this.error = getApiErrorMessage(err, 'Failed to fetch vault settings');
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(settings: Partial<VaultSettings>) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.patch<VaultSettings>('/vault/settings', settings);
        this.productionDir = response.data.productionDir;
        this.testDir = response.data.testDir;
        this.activeMode = response.data.activeMode;
        return true;
      } catch (err: unknown) {
        this.error = getApiErrorMessage(err, 'Failed to update vault settings');
        console.error(err);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async toggleMode() {
      const newMode = this.activeMode === 'production' ? 'test' : 'production';
      return this.updateSettings({ activeMode: newMode });
    },
  },
});
