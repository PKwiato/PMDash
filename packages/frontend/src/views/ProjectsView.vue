<script setup lang="ts">
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { ProjectDto } from '../types/api';

const router = useRouter();
const projects = ref<ProjectDto[]>([]);
const error = ref<string | null>(null);
const creating = ref(false);
const newTitle = ref('');
const newDescription = ref('');

async function load() {
  error.value = null;
  try {
    const { data } = await axios.get<ProjectDto[]>('/api/projects');
    projects.value = data;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function createProject() {
  if (!newTitle.value.trim()) return;
  creating.value = true;
  error.value = null;
  try {
    const { data } = await axios.post<ProjectDto>('/api/projects', {
      title: newTitle.value.trim(),
      description: newDescription.value.trim() || undefined,
    });
    newTitle.value = '';
    newDescription.value = '';
    await load();
    await router.push(`/projects/${data.id}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    creating.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <h1>PMDash — projekty</h1>

    <p v-if="error" class="err">{{ error }}</p>

    <section class="card">
      <h2>Nowy projekt (tylko lokalny, bez Jiry)</h2>
      <form class="form" @submit.prevent="createProject">
        <label>
          Tytuł
          <input v-model="newTitle" type="text" required placeholder="Nazwa projektu" />
        </label>
        <label>
          Opis (opcjonalnie)
          <textarea v-model="newDescription" rows="2" placeholder="Krótki opis" />
        </label>
        <button type="submit" :disabled="creating">Utwórz</button>
      </form>
    </section>

    <section v-if="!error || projects.length" class="card">
      <h2>Lista</h2>
      <p v-if="projects.length === 0" class="muted">Brak projektów.</p>
      <ul v-else class="list">
        <li v-for="p in projects" :key="p.id">
          <router-link :to="`/projects/${p.id}`" class="link">{{ p.title }}</router-link>
          <span v-if="p.source === 'local'" class="badge">Tylko lokalnie</span>
          <span v-else class="badge badge-jira">Powiązany z Jirą</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: 1.5rem;
  font-family: system-ui, sans-serif;
  max-width: 42rem;
}
h1 {
  font-size: 1.5rem;
}
h2 {
  font-size: 1rem;
  margin-top: 0;
}
.err {
  color: #a32d2d;
}
.muted {
  color: #5f5e5a;
}
.card {
  margin-top: 1.25rem;
  padding: 1rem;
  border: 1px solid #e2e0d9;
  border-radius: 8px;
  background: #faf9f6;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}
input,
textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  background: #185fa5;
  color: #fff;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid #eee;
}
.link {
  color: #185fa5;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
.badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: #f1efe8;
  color: #5f5e5a;
}
.badge-jira {
  background: #e6f1fb;
  color: #185fa5;
}
</style>
