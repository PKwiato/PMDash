import type { JiraIssueDto, JiraLinkedIssueDto } from '../types/api';
import { isProgramIssueType } from './jiraEpicColors';

function colorFromIssue(issue: JiraIssueDto): string | null {
  return issue.epicColor ?? null;
}

/** Issue keys for programs/epics missing color in cache (not on sprint board). */
export function collectProgramKeysToHydrate(issues: readonly JiraIssueDto[]): string[] {
  const byKey = new Map(issues.map(i => [i.key.toUpperCase(), i]));
  const needed = new Set<string>();

  for (const issue of issues) {
    if (issue.epicKey) {
      const epic = byKey.get(issue.epicKey.toUpperCase());
      if (!epic?.epicColor) needed.add(issue.epicKey);
    }
    if (issue.parent && isProgramIssueType(issue.parent.issueType)) {
      const parent = byKey.get(issue.parent.key.toUpperCase());
      const hasColor = issue.parent.color || parent?.epicColor;
      if (!hasColor) needed.add(issue.parent.key);
    }
  }

  return [...needed];
}

export function enrichLinkedColor(
  ref: JiraLinkedIssueDto,
  allIssues: readonly JiraIssueDto[],
): JiraLinkedIssueDto {
  if (ref.color) return ref;
  const found = allIssues.find(i => i.key.toUpperCase() === ref.key.toUpperCase());
  const color = found ? colorFromIssue(found) : null;
  return color ? { ...ref, color } : ref;
}

export function resolveEpic(
  issue: JiraIssueDto,
  allIssues: readonly JiraIssueDto[],
): JiraLinkedIssueDto | null {
  if (!issue.epicKey) return null;
  const key = issue.epicKey.toUpperCase();
  const found = allIssues.find(i => i.key.toUpperCase() === key);
  if (found) {
    return {
      id: found.id,
      key: found.key,
      summary: found.summary,
      status: found.status,
      priority: found.priority,
      issueType: found.issueType,
      color: colorFromIssue(found),
    };
  }
  return {
    id: issue.epicKey,
    key: issue.epicKey,
    summary: issue.epicKey,
    status: 'Unknown',
    priority: 'Medium',
    issueType: 'Epic',
  };
}

/** Epic first, then immediate parent; skips duplicate when parent.key === epicKey. */
export function ancestorsForDisplay(
  issue: JiraIssueDto,
  allIssues: readonly JiraIssueDto[],
): JiraLinkedIssueDto[] {
  const out: JiraLinkedIssueDto[] = [];
  const seen = new Set<string>();

  const epic = resolveEpic(issue, allIssues);
  if (epic) {
    const k = epic.key.toUpperCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(enrichLinkedColor(epic, allIssues));
    }
  }

  if (issue.parent?.key) {
    const k = issue.parent.key.toUpperCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(enrichLinkedColor(issue.parent, allIssues));
    }
  }

  return out;
}

/**
 * Program/epic key for a task: Epic Link, direct program parent, or walk parent chain.
 */
export function resolveProgramKey(
  issue: JiraIssueDto,
  allIssues: readonly JiraIssueDto[],
  visited: Set<string> = new Set(),
): string | null {
  const self = issue.key.toUpperCase();
  if (visited.has(self)) return null;
  visited.add(self);

  if (issue.epicKey) return issue.epicKey;
  if (issue.parent && isProgramIssueType(issue.parent.issueType)) return issue.parent.key;

  if (issue.parent?.key) {
    const parentIssue = allIssues.find(i => i.key.toUpperCase() === issue.parent!.key.toUpperCase());
    if (parentIssue) return resolveProgramKey(parentIssue, allIssues, visited);
  }
  return null;
}

/** Colored program/epic badge: epic link first, else parent when it is a Program/Epic. */
export function programBadgeForIssue(
  issue: JiraIssueDto,
  allIssues: readonly JiraIssueDto[],
): JiraLinkedIssueDto | null {
  const epic = resolveEpic(issue, allIssues);
  if (epic) return enrichLinkedColor(epic, allIssues);
  if (issue.parent && isProgramIssueType(issue.parent.issueType)) {
    return enrichLinkedColor(issue.parent, allIssues);
  }
  return null;
}

/** @deprecated Use programBadgeForIssue */
export const epicBadgeForIssue = programBadgeForIssue;

export function truncateSummary(summary: string, maxLen = 48): string {
  if (summary.length <= maxLen) return summary;
  return `${summary.slice(0, maxLen - 1)}…`;
}
