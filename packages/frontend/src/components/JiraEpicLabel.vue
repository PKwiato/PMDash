<template>
  <router-link
    :to="`/tasks/${issue.key}`"
    class="inline-flex max-w-full rounded-[3px] hover:brightness-95 transition-[filter]"
    :style="pillStyle"
    :title="`${issue.key}: ${issue.summary}`"
    @click.stop
  >
    <span class="font-semibold text-[10px] leading-[14px] uppercase px-1.5 py-0.5 truncate block">
      {{ displayText }}
    </span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { JiraLinkedIssueDto } from '../types/api';
import {
  jiraEpicLabelBackground,
  jiraEpicLabelTextColor,
} from '../utils/jiraEpicColors';

const props = defineProps<{
  issue: JiraLinkedIssueDto;
}>();

const pillStyle = computed(() => {
  const bg = jiraEpicLabelBackground(props.issue.color, props.issue.key);
  return {
    backgroundColor: bg,
    color: jiraEpicLabelTextColor(bg),
  };
});

const displayText = computed(() => props.issue.summary.toUpperCase());
</script>
