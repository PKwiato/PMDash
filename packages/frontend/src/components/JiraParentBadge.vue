<template>
  <template v-if="displayProgram || (showParent && displayParent)">
    <!-- Card / list / kanban: program pill + optional parent story below -->
    <div v-if="cardLayout" class="flex flex-col gap-1 min-w-0">
      <JiraEpicLabel v-if="displayProgram" :issue="displayProgram" class="max-w-full" />
      <router-link
        v-if="showParent && displayParent"
        :to="`/tasks/${displayParent.key}`"
        class="inline-flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-secondary transition-colors min-w-0 max-w-full"
        :title="`${displayParent.issueType}: ${displayParent.summary}`"
        @click.stop
      >
        <JiraEpicColorDot :color="displayParent.color" />
        <span class="material-symbols-outlined text-[14px] shrink-0 opacity-60">subdirectory_arrow_right</span>
        <span class="font-bold shrink-0">{{ displayParent.key }}</span>
        <span class="truncate opacity-80">{{ truncateSummary(displayParent.summary, 40) }}</span>
      </router-link>
    </div>

    <template v-else>
      <nav
        v-if="variant === 'breadcrumb'"
        class="flex items-center gap-2 flex-wrap min-w-0"
        aria-label="Issue hierarchy"
      >
        <template v-if="displayProgram">
          <JiraEpicLabel :issue="displayProgram" class="max-w-[240px]" />
        </template>
        <template v-if="showParent && displayParent">
          <span v-if="displayProgram" class="text-slate-300 shrink-0">/</span>
          <router-link
            :to="`/tasks/${displayParent.key}`"
            class="inline-flex items-center gap-1.5 text-slate-400 font-label-sm text-label-sm hover:text-secondary min-w-0 truncate max-w-[240px]"
            :title="`${displayParent.key}: ${displayParent.summary}`"
          >
            <JiraEpicColorDot :color="displayParent.color" size="md" />
            <span class="uppercase">{{ displayParent.key }}</span>
            <span v-if="displayParent.summary !== displayParent.key" class="normal-case ml-1 opacity-80">
              · {{ truncateSummary(displayParent.summary) }}
            </span>
          </router-link>
        </template>
      </nav>
      <div v-else class="flex flex-col gap-1 min-w-0">
        <JiraEpicLabel v-if="displayProgram" :issue="displayProgram" class="w-fit max-w-full" />
        <router-link
          v-if="showParent && displayParent"
          :to="`/tasks/${displayParent.key}`"
          class="inline-flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-secondary transition-colors min-w-0 max-w-full"
          :title="`${displayParent.issueType}: ${displayParent.summary}`"
          @click.stop
        >
          <JiraEpicColorDot :color="displayParent.color" />
          <span class="material-symbols-outlined text-[14px] shrink-0 opacity-60">subdirectory_arrow_right</span>
          <span class="font-bold shrink-0">{{ displayParent.key }}</span>
          <span class="truncate opacity-80">{{ truncateSummary(displayParent.summary, 40) }}</span>
        </router-link>
      </div>
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { JiraIssueDto, JiraLinkedIssueDto } from '../types/api';
import {
  enrichLinkedColor,
  programBadgeForIssue,
  truncateSummary,
} from '../utils/jiraIssueHierarchy';
import { useJiraStore } from '../stores/jiraStore';
import JiraEpicColorDot from './JiraEpicColorDot.vue';
import JiraEpicLabel from './JiraEpicLabel.vue';

const props = withDefaults(
  defineProps<{
    issue: JiraIssueDto;
    variant?: 'inline' | 'breadcrumb';
    /** Compact card row: program pill + parent link (Kanban, list, …). */
    cardLayout?: boolean;
    showParent?: boolean;
  }>(),
  {
    variant: 'inline',
    cardLayout: false,
    showParent: true,
  },
);

const jiraStore = useJiraStore();

const displayProgram = computed(() => programBadgeForIssue(props.issue, jiraStore.issues));

const displayParent = computed((): JiraLinkedIssueDto | null => {
  if (!props.issue.parent) return null;
  const program = displayProgram.value;
  if (program && props.issue.parent.key.toUpperCase() === program.key.toUpperCase()) return null;
  return enrichLinkedColor(props.issue.parent, jiraStore.issues);
});

</script>
