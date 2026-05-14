import { businessDaysUtcBetween } from './businessDaysUtc';

export interface ChangelogStatusTransition {
  atMs: number;
  fromStatus: string | null;
  toStatus: string | null;
}

export interface JiraChangelogHistoryInput {
  id: string;
  created: string;
  items: Array<{
    field: string;
    fromString?: string | null;
    toString?: string | null;
  }>;
}

/** Parse Jira +0100 / Z style timestamps to epoch ms. */
export function parseJiraDateMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

/**
 * Flatten status transitions from changelog histories (same `created` may hold multiple items).
 */
export function extractStatusTransitions(histories: JiraChangelogHistoryInput[]): ChangelogStatusTransition[] {
  const out: ChangelogStatusTransition[] = [];
  for (const h of histories) {
    const atMs = parseJiraDateMs(h.created);
    if (!Number.isFinite(atMs)) continue;
    for (const it of h.items) {
      if (it.field !== 'status') continue;
      out.push({
        atMs,
        fromStatus: it.fromString ?? null,
        toStatus: it.toString ?? null,
      });
    }
  }
  out.sort((a, b) => a.atMs - b.atMs || 0);
  return out;
}

export interface StatusDwellRow {
  status: string;
  businessDays: number;
}

/**
 * Build dwell segments from issue `created`, current status name, and status transitions.
 * Uses half-open intervals [enter, next_change).
 */
export function statusDwellBusinessDaysFromChangelog(
  issueCreatedIso: string,
  currentStatusName: string,
  histories: JiraChangelogHistoryInput[],
  nowMs: number = Date.now(),
): StatusDwellRow[] {
  const createdMs = parseJiraDateMs(issueCreatedIso);
  const endMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  if (!Number.isFinite(createdMs) || endMs <= createdMs) {
    return [{ status: currentStatusName, businessDays: 0 }];
  }

  const transitions = extractStatusTransitions(histories);
  const dwellByStatus = new Map<string, number>();

  function addDwell(status: string, fromMs: number, toMs: number) {
    if (toMs <= fromMs || !status) return;
    const delta = businessDaysUtcBetween(fromMs, toMs);
    dwellByStatus.set(status, (dwellByStatus.get(status) ?? 0) + delta);
  }

  if (transitions.length === 0) {
    addDwell(currentStatusName, createdMs, endMs);
    const rows0 = rowsFromMap(dwellByStatus);
    return rows0.length > 0 ? rows0 : [{ status: currentStatusName, businessDays: 0 }];
  }

  // First segment: from creation until first transition — issue was in `fromStatus` of first transition
  const first = transitions[0]!;
  const initialStatus = first.fromStatus ?? '(unknown)';
  addDwell(initialStatus, createdMs, first.atMs);

  for (let i = 0; i < transitions.length; i++) {
    const tr = transitions[i]!;
    const entered = tr.toStatus ?? currentStatusName;
    const nextAt = i + 1 < transitions.length ? transitions[i + 1]!.atMs : endMs;
    addDwell(entered, tr.atMs, nextAt);
  }

  const rows = rowsFromMap(dwellByStatus);
  return rows.length > 0 ? rows : [{ status: currentStatusName, businessDays: 0 }];
}

function rowsFromMap(m: Map<string, number>): StatusDwellRow[] {
  return Array.from(m.entries())
    .map(([status, businessDays]) => ({
      status,
      businessDays: Math.round(businessDays * 1000) / 1000,
    }))
    .filter(r => r.businessDays > 0)
    .sort((a, b) => b.businessDays - a.businessDays);
}

/**
 * Business days (Mon–Fri UTC, fractional) from the last status change until `nowMs`.
 * If there were no status transitions, uses [created, nowMs) — entire lifetime in first status.
 */
export function businessDaysInCurrentStatusFromChangelog(
  issueCreatedIso: string,
  histories: JiraChangelogHistoryInput[],
  nowMs: number = Date.now(),
): number {
  const createdMs = parseJiraDateMs(issueCreatedIso);
  const endMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  if (!Number.isFinite(createdMs) || endMs <= createdMs) {
    return 0;
  }

  const transitions = extractStatusTransitions(histories);
  if (transitions.length === 0) {
    return businessDaysUtcBetween(createdMs, endMs);
  }

  const last = transitions[transitions.length - 1]!;
  return businessDaysUtcBetween(last.atMs, endMs);
}

const STATUS_ORDER: Record<string, number> = {
  'to do': 0,
  'do zrobienia': 0,
  'open': 0,
  'otwarte': 0,
  'backlog': 0,
  'selected for development': 0,
  'in progress': 1,
  'w toku': 1,
  'development': 1,
  'w pracy': 1,
  'in dev': 1,
  'running': 1,
  'code review': 2,
  'do przeglądu': 2,
  'review': 2,
  'in review': 2,
  'testing': 3,
  'testowanie': 3,
  'qa': 3,
  'test': 3,
  'ready for qa': 3,
  'to test': 3,
  'beta': 4,
  'staging': 4,
  'done': 5,
  'gotowe': 5,
  'zrobione': 5,
  'closed': 5,
  'resolved': 5,
  'zamknięte': 5,
};

function getStatusOrder(status: string | null | undefined): number {
  if (!status) return 0;
  const s = status.toLowerCase().trim();
  if (STATUS_ORDER[s] !== undefined) return STATUS_ORDER[s];
  if (s.includes('test')) return 3;
  if (s.includes('review')) return 2;
  if (s.includes('prog') || s.includes('toku') || s.includes('dev')) return 1;
  if (s.includes('done') || s.includes('gotowe') || s.includes('zrobion')) return 5;
  return 0;
}

/**
 * Counts how many times an issue moved from a "right" status to a "left" status.
 * e.g., from Testing (3) to In Progress (1).
 */
export function returnsCountFromChangelog(histories: JiraChangelogHistoryInput[]): number {
  const transitions = extractStatusTransitions(histories);
  let count = 0;
  for (const tr of transitions) {
    const fromOrder = getStatusOrder(tr.fromStatus);
    const toOrder = getStatusOrder(tr.toStatus);
    if (toOrder < fromOrder) {
      count++;
    }
  }
  return count;
}
