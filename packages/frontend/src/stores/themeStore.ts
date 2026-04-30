import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>((localStorage.getItem('theme') as 'light' | 'dark') || 'light');

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme;
  }

  // Update HTML class and localStorage
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, { immediate: true });

  return {
    theme,
    toggleTheme,
    setTheme
  };
});
