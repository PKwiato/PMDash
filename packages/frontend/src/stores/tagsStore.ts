import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, getApiErrorMessage } from '../api/client';
import type { TagSummary } from '../types/api';
import { TAG_CATEGORY_CUSTOM } from '../types/api';

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<TagSummary[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const customTags = computed(() => tags.value.filter(t => t.category === TAG_CATEGORY_CUSTOM));
  const autoTags = computed(() => tags.value.filter(t => t.category !== TAG_CATEGORY_CUSTOM));
  const slugSet = computed(() => new Set(tags.value.map(t => t.slug)));

  async function fetchAll() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<TagSummary[]>('/tags');
      tags.value = response.data;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to fetch tags');
      console.error('Error fetching tags:', err);
    } finally {
      loading.value = false;
    }
  }

  async function rename(oldSlug: string, newSlug: string) {
    error.value = null;
    try {
      await api.patch(`/tags/${encodeURIComponent(oldSlug)}`, { slug: newSlug });
      await fetchAll();
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to rename tag');
      throw err;
    }
  }

  async function remove(slug: string) {
    error.value = null;
    try {
      await api.delete(`/tags/${encodeURIComponent(slug)}`);
      await fetchAll();
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Failed to delete tag');
      throw err;
    }
  }

  return {
    tags,
    customTags,
    autoTags,
    slugSet,
    loading,
    error,
    fetchAll,
    rename,
    remove,
  };
});
