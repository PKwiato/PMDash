/** Kanban column labels (single source of truth with KanbanView). */
export const KANBAN_COLUMNS = [
  'Do zrobienia',
  'W toku',
  'Code Review',
  'Testowanie',
  'Beta',
  'Gotowe',
] as const;

export type KanbanColumn = (typeof KANBAN_COLUMNS)[number];

export type IssueMetricBucket = 'todo' | 'inFlight' | 'done' | 'blocked';

const statusMapping: Record<string, KanbanColumn> = {
  'to do': 'Do zrobienia',
  open: 'Do zrobienia',
  backlog: 'Do zrobienia',
  'selected for development': 'Do zrobienia',
  'do zrobienia': 'Do zrobienia',
  otwarte: 'Do zrobienia',
  'in progress': 'W toku',
  development: 'W toku',
  running: 'W toku',
  'in dev': 'W toku',
  'w toku': 'W toku',
  'w pracy': 'W toku',
  'code review': 'Code Review',
  review: 'Code Review',
  'peer review': 'Code Review',
  'in review': 'Code Review',
  'do przeglądu': 'Code Review',
  testing: 'Testowanie',
  qa: 'Testowanie',
  test: 'Testowanie',
  'ready for qa': 'Testowanie',
  'qa ready': 'Testowanie',
  'ready for test': 'Testowanie',
  'ready for testing': 'Testowanie',
  'to test': 'Testowanie',
  testowanie: 'Testowanie',
  beta: 'Beta',
  staging: 'Beta',
  done: 'Gotowe',
  closed: 'Gotowe',
  resolved: 'Gotowe',
  finished: 'Gotowe',
  gotowe: 'Gotowe',
  zrobione: 'Gotowe',
  ukończone: 'Gotowe',
  zamknięte: 'Gotowe',
};

function normalize(raw: string | undefined | null): string {
  return (raw ?? 'To Do').toLowerCase().trim();
}

/** Heuristic: Jira "blocked" style statuses (localized). */
export function isBlockedJiraStatus(raw: string | undefined | null): boolean {
  const n = normalize(raw);
  return (
    n.includes('block') ||
    n.includes('zablok') ||
    n.includes('impediment') ||
    n.includes('przeszkod')
  );
}

/**
 * Maps Jira `status.name` to the same Kanban column used in KanbanView.
 */
export function mapJiraStatusToKanbanColumn(rawStatus: string | undefined | null): KanbanColumn {
  const key = normalize(rawStatus);

  const mapped: KanbanColumn =
    statusMapping[key] ??
    (key.includes('done') || key.includes('zrobione') ? 'Gotowe' : 'Do zrobienia');

  if ((KANBAN_COLUMNS as readonly string[]).includes(mapped)) {
    return mapped;
  }

  return 'Do zrobienia';
}

function columnToMetricBucket(column: KanbanColumn): Exclude<IssueMetricBucket, 'blocked'> {
  if (column === 'Gotowe') return 'done';
  if (column === 'Do zrobienia') return 'todo';
  return 'inFlight';
}

/** Bucket for dashboard metrics; blocked is exclusive (not also todo/inFlight/done). */
export function metricBucketForIssue(status: string | undefined | null): IssueMetricBucket {
  if (isBlockedJiraStatus(status)) return 'blocked';
  return columnToMetricBucket(mapJiraStatusToKanbanColumn(status));
}

export function groupIssuesByKanbanColumn<T extends { status: string }>(
  issues: T[],
): Record<KanbanColumn, T[]> {
  const groups = {} as Record<KanbanColumn, T[]>;
  for (const c of KANBAN_COLUMNS) {
    groups[c] = [];
  }

  for (const issue of issues) {
    const column = mapJiraStatusToKanbanColumn(issue.status);
    if (groups[column]) {
      groups[column].push(issue);
    } else {
      groups['Do zrobienia'].push(issue);
    }
  }

  return groups;
}
