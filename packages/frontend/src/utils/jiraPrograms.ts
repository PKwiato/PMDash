import type { JiraIssueDto, JiraLinkedIssueDto } from '../types/api';
import { isProgramIssueType, jiraEpicLabelBackground } from './jiraEpicColors';
import {
  enrichLinkedColor,
  programBadgeForIssue,
  resolveEpic,
} from './jiraIssueHierarchy';
import { mapJiraStatusToKanbanColumn, metricBucketForIssue } from './jiraIssueStatus';

export type ProgramTaskStatusLabel = 'ON TRACK' | 'AT RISK' | 'IN REVIEW' | 'DONE';

export interface ProgramSummary {
  key: string;
  summary: string;
  issueType: string;
  color: string | null;
  themeColor: string;
  todo: number;
  inProgress: number;
  done: number;
  blocked: number;
  total: number;
  progressPercent: number;
  tasks: JiraIssueDto[];
}

export interface ProgramsOverviewStats {
  completionRate: number;
  blockedCount: number;
  totalTasks: number;
  doneTasks: number;
}

export function taskProgramKey(issue: JiraIssueDto): string | null {
  if (issue.epicKey) return issue.epicKey;
  if (issue.parent && isProgramIssueType(issue.parent.issueType)) return issue.parent.key;
  return null;
}

export function taskDisplayStatus(issue: JiraIssueDto): ProgramTaskStatusLabel {
  const bucket = metricBucketForIssue(issue.status);
  if (bucket === 'blocked') return 'AT RISK';
  if (bucket === 'done') return 'DONE';
  const column = mapJiraStatusToKanbanColumn(issue.status);
  if (column === 'Code Review' || column === 'Testowanie' || column === 'Beta') return 'IN REVIEW';
  if (bucket === 'inFlight') return 'IN REVIEW';
  return 'ON TRACK';
}

function programRefFromIssue(issue: JiraIssueDto, allIssues: readonly JiraIssueDto[]): JiraLinkedIssueDto {
  const badge = programBadgeForIssue(issue, allIssues);
  if (badge) return badge;
  return {
    id: issue.id,
    key: issue.key,
    summary: issue.summary,
    status: issue.status,
    priority: issue.priority,
    issueType: issue.issueType,
    color: issue.epicColor ?? null,
  };
}

export function buildProgramsFromIssues(issues: readonly JiraIssueDto[]): ProgramSummary[] {
  const byKey = new Map<string, ProgramSummary>();

  const ensureProgram = (ref: JiraLinkedIssueDto) => {
    const k = ref.key.toUpperCase();
    const existing = byKey.get(k);
    if (existing) {
      if (!existing.color && ref.color) existing.color = ref.color;
      if (existing.summary === existing.key && ref.summary !== ref.key) {
        existing.summary = ref.summary;
      }
      return existing;
    }
    const themeColor = jiraEpicLabelBackground(ref.color, ref.key);
    const entry: ProgramSummary = {
      key: ref.key,
      summary: ref.summary,
      issueType: ref.issueType,
      color: ref.color ?? null,
      themeColor,
      todo: 0,
      inProgress: 0,
      done: 0,
      blocked: 0,
      total: 0,
      progressPercent: 0,
      tasks: [],
    };
    byKey.set(k, entry);
    return entry;
  };

  for (const issue of issues) {
    if (isProgramIssueType(issue.issueType)) {
      ensureProgram(enrichLinkedColor(programRefFromIssue(issue, issues), issues));
    }
  }

  for (const issue of issues) {
    const pk = taskProgramKey(issue);
    if (!pk) continue;
    const epic = resolveEpic(issue, issues);
    const parentProgram =
      issue.parent && isProgramIssueType(issue.parent.issueType)
        ? enrichLinkedColor(issue.parent, issues)
        : null;
    const ref = epic ?? parentProgram;
    if (ref) ensureProgram(ref);
    else ensureProgram({ id: pk, key: pk, summary: pk, status: 'Unknown', priority: 'Medium', issueType: 'Program' });
  }

  for (const issue of issues) {
    if (isProgramIssueType(issue.issueType)) continue;
    const pk = taskProgramKey(issue);
    if (!pk) continue;
    const program = byKey.get(pk.toUpperCase());
    if (!program) continue;
    if (issue.key.toUpperCase() === program.key.toUpperCase()) continue;

    program.tasks.push(issue);
    program.total += 1;
    const bucket = metricBucketForIssue(issue.status);
    if (bucket === 'todo') program.todo += 1;
    else if (bucket === 'inFlight') program.inProgress += 1;
    else if (bucket === 'done') program.done += 1;
    else if (bucket === 'blocked') program.blocked += 1;
  }

  for (const program of byKey.values()) {
    program.progressPercent =
      program.total === 0 ? 0 : Math.round((program.done / program.total) * 100);
  }

  const programs = [...byKey.values()];
  programs.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.summary.localeCompare(b.summary, 'pl');
  });
  return programs;
}

export function computeProgramsOverviewStats(issues: readonly JiraIssueDto[]): ProgramsOverviewStats {
  const tasks = issues.filter(i => !isProgramIssueType(i.issueType));
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(i => metricBucketForIssue(i.status) === 'done').length;
  const blockedCount = tasks.filter(i => metricBucketForIssue(i.status) === 'blocked').length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  return { completionRate, blockedCount, totalTasks, doneTasks };
}

export function formatProgramDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
