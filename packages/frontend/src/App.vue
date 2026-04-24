<script setup lang="ts">
import axios from 'axios';
import { onMounted, ref } from 'vue';

interface ProjectRow {
  id: string;
  title: string;
}

const projects = ref<ProjectRow[]>([]);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const { data } = await axios.get<ProjectRow[]>('/api/projects');
    projects.value = data;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
});
</script>

<template>
  <main style="padding: 1.5rem; font-family: system-ui, sans-serif">
    <h1>PMDash</h1>
    <p v-if="error" style="color: #a32d2d">{{ error }}</p>
    <p v-else-if="projects.length === 0">No projects yet. API is reachable.</p>
    <ul v-else>
      <li v-for="p in projects" :key="p.id">{{ p.title }}</li>
    </ul>
  </main>
</template>
