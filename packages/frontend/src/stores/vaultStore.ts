import { defineStore } from 'pinia';
import axios from 'axios';

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
      try {
        const response = await axios.get<VaultSettings>('/api/vault/settings');
        this.productionDir = response.data.productionDir;
        this.testDir = response.data.testDir;
        this.activeMode = response.data.activeMode;
      } catch (err) {
        this.error = 'Failed to fetch vault settings';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(settings: Partial<VaultSettings>) {
      this.loading = true;
      try {
        const response = await axios.patch<VaultSettings>('/api/vault/settings', settings);
        this.productionDir = response.data.productionDir;
        this.testDir = response.data.testDir;
        this.activeMode = response.data.activeMode;
        return true;
      } catch (err) {
        this.error = 'Failed to update vault settings';
        console.error(err);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async toggleMode() {
      const newMode = this.activeMode === 'production' ? 'test' : 'production';
      return this.updateSettings({ activeMode: newMode });
    }
  }
});
