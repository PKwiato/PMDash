import type { JiraChangelogHistoryDto, JiraIssueDto } from '../types/api';
import { defaultTeamFilterForBoard } from './jiraTeamFilter';
import type { IssueWorklogBreakdown, UserAnalysis } from '../stores/clockworkStore';
import { metricBucketForIssue } from './jiraIssueStatus';
import { buildProgramsFromIssues, collectStatscoreTeams, taskProgramKey } from './jiraPrograms';
import { teamMatchesSelection } from './jiraTeamFilter';
import { isProgramIssueType } from './jiraEpicColors';
import { immediateTaskParentKey } from './jiraIssueHierarchy';

export interface PersonIssueWorkloadRow {
  issueKey: string;
  summary: string;
  status: string;
  programKey: string | null;
  assignee: string | null;
  seconds: number;
  logCount: number;
  percentOfUser: number;
  isAssignee: boolean;
  jiraLinked: boolean;
}

export interface GroupedPersonIssueRow extends PersonIssueWorkloadRow {
  depth: number;
  isSubtask: boolean;
  subtaskCount?: number;
}

export interface PersonWorkload {
  user: UserAnalysis['user'];
  totalSeconds: number;
  issues: PersonIssueWorkloadRow[];
  inconsistencyCount: number;
}

export interface TaskPersonContribution {
  accountId: string;
  displayName: string;
  avatarUrl?: string;
  seconds: number;
}

export interface TaskWorkloadRow {
  issueKey: string;
  summary: string;
  totalSeconds: number;
  percentOfTeam: number;
  contributors: TaskPersonContribution[];
}

export interface CompletedTaskRow {
  issue: JiraIssueDto;
  completedAt: string;
  programKey: string | null;
}

export interface AtRiskTaskRow {
  issue: JiraIssueDto;
  programKey: string | null;
  reason: 'blocked' | 'returns' | 'stagnant';
  detail: string;
}

export interface BiweeklyKpis {
  deliveredCount: number;
  storyPointsDelivered: number;
  inFlightCount: number;
  blockedCount: number;
  returnsCount: number;
  startedCount: number;
  activeTaskCount: number;
}

function parseDateMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : NaN;
}

function dateOnly(isoOrDate: string): string {
  return isoOrDate.split('T')[0] ?? isoOrDate;
}

function isInRange(dateStr: string, from: string, to: string): boolean {
  const d = dateOnly(dateStr);
  return d >= from && d <= to;
}

function isDoneStatus(status: string | null | undefined): boolean {
  return metricBucketForIssue(status) === 'done';
}

function statusOrder(status: string | null | undefined): number {
  const s = (status ?? '').toLowerCase();
  if (s.includes('block') || s.includes('zablok')) return 4;
  if (s.includes('test') || s.includes('qa') || s.includes('beta')) return 3;
  if (s.includes('review')) return 2;
  if (s.includes('prog') || s.includes('toku') || s.includes('dev')) return 1;
  if (s.includes('done') || s.includes('gotowe') || s.includes('zrobion')) return 5;
  return 0;
}

function extractStatusTransitions(histories: JiraChangelogHistoryDto[]) {
  const out: { at: string; fromStatus: string | null; toStatus: string | null }[] = [];
  for (const h of histories) {
    for (const it of h.items) {
      if (it.field !== 'status') continue;
      out.push({
        at: h.created,
        fromStatus: it.fromString,
        toStatus: it.toString,
      });
    }
  }
  out.sort((a, b) => parseDateMs(a.at) - parseDateMs(b.at));
  return out;
}

export function defaultBiweeklyRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 13);
  return {
    from: from.toISOString().split('T')[0]!,
    to: to.toISOString().split('T')[0]!,
  };
}

export function formatPeriodDate(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function teamFilterFromLoadedIssues(
  boardName: string,
  issues: readonly JiraIssueDto[],
): string[] {
  const teams = collectStatscoreTeams(buildProgramsFromIssues(issues));
  return defaultTeamFilterForBoard(boardName, teams);
}

export interface BiweeklyDiagnostics {
  clockworkUsers: number;
  clockworkKeys: number;
  jiraLinked: number;
  teamMatched: number;
  filteredOut: number;
  totalClockworkHours: number;
}

/** Unique issue keys reported in Clockwork for board members. */
export function collectClockworkIssueKeys(analysis: readonly UserAnalysis[]): string[] {
  const keys = new Set<string>();
  for (const item of analysis) {
    for (const row of item.issueBreakdown ?? []) {
      const key = row.issueKey.trim();
      if (key) keys.add(key);
    }
  }
  return [...keys];
}

/** Program/epic keys linked from fetched issues (for team filter hydration). */
export function collectRelatedProgramKeysForIssues(issues: readonly JiraIssueDto[]): string[] {
  const keys = new Set<string>();
  for (const issue of issues) {
    if (issue.epicKey?.trim()) keys.add(issue.epicKey.trim());
    const parentKey = issue.parent?.key?.trim();
    if (parentKey) keys.add(parentKey);
  }
  return [...keys];
}

/** Walk parent pointers so intermediate tasks (e.g. subtasks) resolve program team. */
export function collectParentChainKeys(
  seeds: readonly JiraIssueDto[],
  allIssues: readonly JiraIssueDto[],
): string[] {
  const byKey = new Map(allIssues.map(i => [i.key.toUpperCase(), i]));
  const keys = new Set<string>();
  const visit = (issue: JiraIssueDto, depth: number) => {
    if (depth > 6) return;
    const parentKey = issue.parent?.key?.trim();
    if (!parentKey) return;
    const normalized = parentKey.toUpperCase();
    if (keys.has(normalized)) return;
    keys.add(parentKey);
    const parentIssue = byKey.get(normalized);
    if (parentIssue) visit(parentIssue, depth + 1);
  };
  for (const issue of seeds) visit(issue, 0);
  return [...keys];
}

export function programKeysMissingTeam(
  keys: readonly string[],
  issues: readonly JiraIssueDto[],
): string[] {
  const byKey = new Map(issues.map(i => [i.key.toUpperCase(), i]));
  return keys.filter(key => {
    const issue = byKey.get(key.trim().toUpperCase());
    return issue != null && isProgramIssueType(issue.issueType) && !issue.statscoreTeam?.trim();
  });
}

type FetchIssuesByKeys = (
  keys: string[],
  options?: { includeChangelog?: boolean },
) => Promise<readonly JiraIssueDto[]>;

/** Fetch clockwork issues, parent chains, and programs needed for team filter. */
export async function hydrateClockworkTeamContext(
  cwKeys: readonly string[],
  fetchByKeys: FetchIssuesByKeys,
  getIssues: () => readonly JiraIssueDto[],
): Promise<void> {
  const normalized = [...new Set(cwKeys.map(k => k.trim()).filter(Boolean))];
  if (normalized.length === 0) return;

  await fetchByKeys(normalized, { includeChangelog: false });

  for (let round = 0; round < 4; round++) {
    const issues = getIssues();
    const linked = normalized
      .map(k => issues.find(i => i.key.toUpperCase() === k.toUpperCase()))
      .filter((i): i is JiraIssueDto => i != null);

    const toFetch = new Set<string>([
      ...collectRelatedProgramKeysForIssues(linked),
      ...collectParentChainKeys(linked, issues),
    ]);
    const missing = missingIssueKeys([...toFetch], issues);
    if (missing.length === 0) break;
    await fetchByKeys(missing, { includeChangelog: false });
  }

  const issues = getIssues();
  const linked = normalized
    .map(k => issues.find(i => i.key.toUpperCase() === k.toUpperCase()))
    .filter((i): i is JiraIssueDto => i != null);
  const programKeys = collectRelatedProgramKeysForIssues(linked).filter(key => {
    const issue = issues.find(i => i.key.toUpperCase() === key.toUpperCase());
    return issue != null && isProgramIssueType(issue.issueType);
  });
  const stalePrograms = programKeysMissingTeam(programKeys, issues);
  if (stalePrograms.length > 0) {
    await fetchByKeys(stalePrograms, { includeChangelog: false });
  }
}

export function missingIssueKeys(
  keys: readonly string[],
  issues: readonly JiraIssueDto[],
): string[] {
  const have = new Set(issues.map(i => i.key.toUpperCase()));
  return keys.filter(k => k.trim() && !have.has(k.trim().toUpperCase()));
}

export function computeBiweeklyDiagnostics(
  analysis: readonly UserAnalysis[],
  allIssues: readonly JiraIssueDto[],
  selectedTeams: readonly string[],
): BiweeklyDiagnostics {
  const cwKeys = collectClockworkIssueKeys(analysis);
  const issueByKey = new Map(allIssues.map(i => [i.key.toUpperCase(), i]));
  let jiraLinked = 0;
  let teamMatched = 0;

  for (const key of cwKeys) {
    const issue = issueByKey.get(key.toUpperCase());
    if (!issue) continue;
    jiraLinked += 1;
    if (issueBelongsToTeam(issue, allIssues, selectedTeams)) teamMatched += 1;
  }

  const totalClockworkHours = analysis.reduce((sum, item) => sum + item.totalSeconds, 0) / 3600;

  return {
    clockworkUsers: analysis.length,
    clockworkKeys: cwKeys.length,
    jiraLinked,
    teamMatched,
    filteredOut: cwKeys.length - teamMatched,
    totalClockworkHours,
  };
}

/**
 * Whether a Jira issue belongs to the selected STATSCORE team(s).
 * Checks issue statscoreTeam, parent program, and program task membership.
 */
export function issueBelongsToTeam(
  issue: JiraIssueDto,
  allIssues: readonly JiraIssueDto[],
  selectedTeams: readonly string[],
): boolean {
  if (selectedTeams.length === 0) return true;

  if (teamMatchesSelection(issue.statscoreTeam, selectedTeams)) return true;

  const programKey = taskProgramKey(issue, allIssues);
  if (programKey) {
    const program = allIssues.find(i => i.key.toUpperCase() === programKey.toUpperCase());
    if (program && teamMatchesSelection(program.statscoreTeam, selectedTeams)) return true;
  }

  const programs = buildProgramsFromIssues(allIssues);
  for (const program of programs) {
    if (!teamMatchesSelection(program.statscoreTeam, selectedTeams, { includeUnassigned: false })) {
      continue;
    }
    if (program.tasks.some(t => t.key.toUpperCase() === issue.key.toUpperCase())) return true;
  }

  return false;
}

function clockworkRowMatchesTeam(
  issue: JiraIssueDto | undefined,
  allIssues: readonly JiraIssueDto[],
  selectedTeams: readonly string[],
): boolean {
  if (!issue) return false;
  return issueBelongsToTeam(issue, allIssues, selectedTeams);
}

/** Tasks belonging to programs matching the selected STATSCORE teams. */
export function teamTasksFromIssues(
  issues: readonly JiraIssueDto[],
  selectedTeams: readonly string[],
): JiraIssueDto[] {
  if (selectedTeams.length === 0) {
    return issues.filter(i => !isProgramIssueType(i.issueType));
  }

  const seen = new Set<string>();
  const tasks: JiraIssueDto[] = [];

  for (const issue of issues) {
    if (isProgramIssueType(issue.issueType)) continue;
    if (!issueBelongsToTeam(issue, issues, selectedTeams)) continue;
    const key = issue.key.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tasks.push(issue);
  }

  return tasks;
}

/**
 * Clockwork-reported issues joined with Jira and filtered to the team.
 * Source of truth: worklogs; Jira enriches; team filter applied after join.
 */
export function activeTeamTasksFromClockwork(
  analysis: readonly UserAnalysis[],
  allIssues: readonly JiraIssueDto[],
  selectedTeams: readonly string[],
): JiraIssueDto[] {
  const issueByKey = new Map(allIssues.map(i => [i.key.toUpperCase(), i]));
  const seen = new Set<string>();
  const tasks: JiraIssueDto[] = [];

  for (const item of analysis) {
    for (const row of item.issueBreakdown ?? []) {
      const normalized = row.issueKey.toUpperCase();
      if (seen.has(normalized)) continue;
      const issue = issueByKey.get(normalized);
      if (!clockworkRowMatchesTeam(issue, allIssues, selectedTeams)) continue;
      seen.add(normalized);
      tasks.push(issue!);
    }
  }

  return tasks;
}

export function firstTransitionToDoneInPeriod(
  issue: JiraIssueDto,
  from: string,
  to: string,
): string | null {
  const transitions = extractStatusTransitions(issue.changelog ?? []);
  for (const tr of transitions) {
    if (isDoneStatus(tr.toStatus) && isInRange(tr.at, from, to)) {
      return tr.at;
    }
  }
  return null;
}

export function enteredInProgressInPeriod(
  issue: JiraIssueDto,
  from: string,
  to: string,
): boolean {
  const transitions = extractStatusTransitions(issue.changelog ?? []);
  for (const tr of transitions) {
    const order = statusOrder(tr.toStatus);
    if (order >= 1 && order <= 3 && isInRange(tr.at, from, to)) return true;
  }
  if (issue.created && isInRange(issue.created, from, to)) {
    const bucket = metricBucketForIssue(issue.status);
    if (bucket === 'inFlight' || bucket === 'done') return true;
  }
  return false;
}

export function returnsInPeriod(issue: JiraIssueDto, from: string, to: string): number {
  const transitions = extractStatusTransitions(issue.changelog ?? []);
  let count = 0;
  for (const tr of transitions) {
    if (!isInRange(tr.at, from, to)) continue;
    const fromOrder = statusOrder(tr.fromStatus);
    const toOrder = statusOrder(tr.toStatus);
    if (toOrder < fromOrder) count += 1;
  }
  return count;
}

export function completedTasksInPeriod(
  tasks: readonly JiraIssueDto[],
  allIssues: readonly JiraIssueDto[],
  from: string,
  to: string,
): CompletedTaskRow[] {
  const rows: CompletedTaskRow[] = [];
  for (const issue of tasks) {
    const completedAt = firstTransitionToDoneInPeriod(issue, from, to);
    if (!completedAt) continue;
    rows.push({
      issue,
      completedAt,
      programKey: taskProgramKey(issue, allIssues),
    });
  }
  rows.sort((a, b) => parseDateMs(b.completedAt) - parseDateMs(a.completedAt));
  return rows;
}

export function atRiskTasks(
  tasks: readonly JiraIssueDto[],
  allIssues: readonly JiraIssueDto[],
  from: string,
  to: string,
): AtRiskTaskRow[] {
  const rows: AtRiskTaskRow[] = [];
  for (const issue of tasks) {
    if (metricBucketForIssue(issue.status) === 'done') continue;

    const programKey = taskProgramKey(issue, allIssues);
    const returns = returnsInPeriod(issue, from, to);
    const stagnantDays = issue.currentStatusBusinessDays ?? 0;

    if (metricBucketForIssue(issue.status) === 'blocked') {
      rows.push({ issue, programKey, reason: 'blocked', detail: issue.status });
      continue;
    }
    if (returns > 0) {
      rows.push({
        issue,
        programKey,
        reason: 'returns',
        detail: `${returns} powrót(ów) w okresie`,
      });
      continue;
    }
    if (stagnantDays >= 5) {
      rows.push({
        issue,
        programKey,
        reason: 'stagnant',
        detail: `${stagnantDays} dni rob. w «${issue.status}»`,
      });
    }
  }

  rows.sort((a, b) => {
    const order = { blocked: 0, returns: 1, stagnant: 2 };
    return order[a.reason] - order[b.reason];
  });
  return rows;
}

function normalizeAssignee(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase();
}

/** Worklogs per person; team filter applied after Jira join. */
export function buildPersonWorkloads(
  analysis: readonly UserAnalysis[],
  allIssues: readonly JiraIssueDto[],
  selectedTeams: readonly string[],
): PersonWorkload[] {
  const issueByKey = new Map(allIssues.map(i => [i.key.toUpperCase(), i]));

  const workloads: PersonWorkload[] = [];

  for (const item of analysis) {
    const byIssue = new Map<string, { seconds: number; logCount: number }>();
    for (const row of item.issueBreakdown ?? []) {
      const key = row.issueKey.toUpperCase();
      const issue = issueByKey.get(key);
      if (!clockworkRowMatchesTeam(issue, allIssues, selectedTeams)) continue;
      const existing = byIssue.get(key) ?? { seconds: 0, logCount: 0 };
      existing.seconds += row.seconds;
      existing.logCount += row.logCount;
      byIssue.set(key, existing);
    }

    if (byIssue.size === 0) continue;

    const userName = normalizeAssignee(item.user.displayName);
    let totalSeconds = 0;
    const issues: PersonIssueWorkloadRow[] = [];

    for (const [key, stats] of byIssue.entries()) {
      totalSeconds += stats.seconds;
      const issue = issueByKey.get(key);
      const assignee = issue?.assignee ?? null;
      issues.push({
        issueKey: issue?.key ?? rowIssueKey(item.issueBreakdown, key),
        summary: issue?.summary ?? rowIssueKey(item.issueBreakdown, key),
        status: issue?.status ?? '—',
        programKey: issue ? taskProgramKey(issue, allIssues) : null,
        assignee,
        seconds: stats.seconds,
        logCount: stats.logCount,
        percentOfUser: 0,
        isAssignee: normalizeAssignee(assignee) === userName,
        jiraLinked: issue != null,
      });
    }

    for (const row of issues) {
      row.percentOfUser = totalSeconds > 0 ? Math.round((row.seconds / totalSeconds) * 100) : 0;
    }
    issues.sort((a, b) => b.seconds - a.seconds);

    workloads.push({
      user: item.user,
      totalSeconds,
      issues,
      inconsistencyCount: item.inconsistencies.length,
    });
  }

  workloads.sort((a, b) => {
    const byHours = b.totalSeconds - a.totalSeconds;
    if (byHours !== 0) return byHours;
    return a.user.displayName.localeCompare(b.user.displayName, 'pl');
  });
  return workloads;
}

function syntheticParentRow(
  parentKey: string,
  parentIssue: JiraIssueDto | undefined,
  allIssues: readonly JiraIssueDto[],
): PersonIssueWorkloadRow {
  return {
    issueKey: parentIssue?.key ?? parentKey,
    summary: parentIssue?.summary ?? parentKey,
    status: parentIssue?.status ?? '—',
    programKey: parentIssue ? taskProgramKey(parentIssue, allIssues) : null,
    assignee: parentIssue?.assignee ?? null,
    seconds: 0,
    logCount: 0,
    percentOfUser: 0,
    isAssignee: false,
    jiraLinked: parentIssue != null,
  };
}

/**
 * Groups subtasks under their parent task for display.
 * Parents without own worklogs get a header row; children are indented.
 */
export function groupPersonIssueRows(
  rows: readonly PersonIssueWorkloadRow[],
  allIssues: readonly JiraIssueDto[],
): GroupedPersonIssueRow[] {
  if (rows.length === 0) return [];

  const issueByKey = new Map(allIssues.map(i => [i.key.toUpperCase(), i]));
  const rowByKey = new Map(rows.map(r => [r.issueKey.toUpperCase(), r]));
  const childrenByParent = new Map<string, PersonIssueWorkloadRow[]>();

  for (const row of rows) {
    const issue = issueByKey.get(row.issueKey.toUpperCase());
    const parentKey = issue ? immediateTaskParentKey(issue) : null;
    if (!parentKey) continue;
    const normalized = parentKey.toUpperCase();
    const list = childrenByParent.get(normalized) ?? [];
    list.push(row);
    childrenByParent.set(normalized, list);
  }

  if (childrenByParent.size === 0) {
    return rows.map(row => ({ ...row, depth: 0, isSubtask: false }));
  }

  type IssueGroup = {
    parentKey: string;
    parentRow: PersonIssueWorkloadRow;
    children: PersonIssueWorkloadRow[];
    groupSeconds: number;
  };

  const groups: IssueGroup[] = [];
  const groupedParentKeys = new Set<string>();

  for (const [parentKey, children] of childrenByParent.entries()) {
    const parentIssue = issueByKey.get(parentKey);
    const parentRow = rowByKey.get(parentKey) ?? syntheticParentRow(parentKey, parentIssue, allIssues);
    const groupSeconds =
      parentRow.seconds + children.reduce((sum, child) => sum + child.seconds, 0);
    children.sort((a, b) => b.seconds - a.seconds);
    groups.push({ parentKey, parentRow, children, groupSeconds });
    groupedParentKeys.add(parentKey);
  }

  for (const row of rows) {
    const normalized = row.issueKey.toUpperCase();
    if (groupedParentKeys.has(normalized)) continue;
    const issue = issueByKey.get(normalized);
    if (issue && immediateTaskParentKey(issue)) continue;
    groups.push({
      parentKey: normalized,
      parentRow: row,
      children: [],
      groupSeconds: row.seconds,
    });
  }

  groups.sort((a, b) => b.groupSeconds - a.groupSeconds);

  const out: GroupedPersonIssueRow[] = [];
  for (const group of groups) {
    const hasChildren = group.children.length > 0;
    out.push({
      ...group.parentRow,
      depth: 0,
      isSubtask: false,
      subtaskCount: hasChildren ? group.children.length : undefined,
    });
    for (const child of group.children) {
      out.push({ ...child, depth: 1, isSubtask: true });
    }
  }
  return out;
}

/** Rolls subtask hours into parent tasks for team-level task charts. */
export function rollupSubtasksInTaskWorkloads(
  tasks: readonly TaskWorkloadRow[],
  allIssues: readonly JiraIssueDto[],
): TaskWorkloadRow[] {
  if (tasks.length === 0) return [];

  const issueByKey = new Map(allIssues.map(i => [i.key.toUpperCase(), i]));
  const taskByKey = new Map(tasks.map(t => [t.issueKey.toUpperCase(), t]));
  const childrenByParent = new Map<string, TaskWorkloadRow[]>();

  for (const task of tasks) {
    const issue = issueByKey.get(task.issueKey.toUpperCase());
    const parentKey = issue ? immediateTaskParentKey(issue) : null;
    if (!parentKey) continue;
    const normalized = parentKey.toUpperCase();
    const list = childrenByParent.get(normalized) ?? [];
    list.push(task);
    childrenByParent.set(normalized, list);
  }

  if (childrenByParent.size === 0) return [...tasks];

  const merged = new Map<string, TaskWorkloadRow>();

  const mergeContributors = (
    base: TaskPersonContribution[],
    extra: TaskPersonContribution[],
  ): TaskPersonContribution[] => {
    const byId = new Map(base.map(c => [c.accountId, { ...c }]));
    for (const c of extra) {
      const existing = byId.get(c.accountId);
      if (existing) {
        existing.seconds += c.seconds;
      } else {
        byId.set(c.accountId, { ...c });
      }
    }
    return [...byId.values()].sort((a, b) => b.seconds - a.seconds);
  };

  for (const [parentKey, children] of childrenByParent.entries()) {
    const parentIssue = issueByKey.get(parentKey);
    const parentTask = taskByKey.get(parentKey);
    const childSeconds = children.reduce((sum, c) => sum + c.totalSeconds, 0);
    const childContributors = children.flatMap(c => c.contributors);

    if (parentTask) {
      merged.set(parentKey, {
        ...parentTask,
        totalSeconds: parentTask.totalSeconds + childSeconds,
        contributors: mergeContributors(parentTask.contributors, childContributors),
      });
    } else {
      merged.set(parentKey, {
        issueKey: parentIssue?.key ?? parentKey,
        summary: parentIssue?.summary ?? parentKey,
        totalSeconds: childSeconds,
        percentOfTeam: 0,
        contributors: mergeContributors([], childContributors),
      });
    }
  }

  for (const task of tasks) {
    const normalized = task.issueKey.toUpperCase();
    const issue = issueByKey.get(normalized);
    if (issue && immediateTaskParentKey(issue)) continue;
    if (merged.has(normalized)) continue;
    merged.set(normalized, { ...task });
  }

  const totalSeconds = [...merged.values()].reduce((sum, t) => sum + t.totalSeconds, 0);
  const rolled = [...merged.values()].map(task => ({
    ...task,
    percentOfTeam: totalSeconds > 0 ? Math.round((task.totalSeconds / totalSeconds) * 100) : 0,
  }));
  rolled.sort((a, b) => b.totalSeconds - a.totalSeconds);
  return rolled;
}

/** Board members with Clockwork hours but no tasks passing the team filter. */
export function buildFilteredOutPersonWorkloads(
  analysis: readonly UserAnalysis[],
  allIssues: readonly JiraIssueDto[],
  selectedTeams: readonly string[],
): PersonWorkload[] {
  const visibleIds = new Set(
    buildPersonWorkloads(analysis, allIssues, selectedTeams).map(p => p.user.accountId),
  );
  const issueByKey = new Map(allIssues.map(i => [i.key.toUpperCase(), i]));
  const workloads: PersonWorkload[] = [];

  for (const item of analysis) {
    if (item.totalSeconds <= 0 || visibleIds.has(item.user.accountId)) continue;

    const issues: PersonIssueWorkloadRow[] = [];
    for (const row of item.issueBreakdown ?? []) {
      const key = row.issueKey.toUpperCase();
      const issue = issueByKey.get(key);
      issues.push({
        issueKey: issue?.key ?? row.issueKey,
        summary: issue?.summary ?? row.issueKey,
        status: issue?.status ?? '—',
        programKey: issue ? taskProgramKey(issue, allIssues) : null,
        assignee: issue?.assignee ?? null,
        seconds: row.seconds,
        logCount: row.logCount,
        percentOfUser: 0,
        isAssignee: false,
        jiraLinked: issue != null,
      });
    }
    if (issues.length === 0) continue;

    const totalSeconds = issues.reduce((sum, row) => sum + row.seconds, 0);
    for (const row of issues) {
      row.percentOfUser = totalSeconds > 0 ? Math.round((row.seconds / totalSeconds) * 100) : 0;
    }
    issues.sort((a, b) => b.seconds - a.seconds);

    workloads.push({
      user: item.user,
      totalSeconds,
      issues,
      inconsistencyCount: item.inconsistencies.length,
    });
  }

  workloads.sort((a, b) => a.user.displayName.localeCompare(b.user.displayName, 'pl'));
  return workloads;
}

function rowIssueKey(breakdown: readonly IssueWorklogBreakdown[], normalizedKey: string): string {
  return breakdown.find(r => r.issueKey.toUpperCase() === normalizedKey)?.issueKey ?? normalizedKey;
}

export function totalTeamWorklogSeconds(workloads: readonly PersonWorkload[]): number {
  return workloads.reduce((sum, person) => sum + person.totalSeconds, 0);
}

/** Worklogs per task with per-person breakdown; team filter applied after Jira join. */
export function buildTaskWorkloads(
  analysis: readonly UserAnalysis[],
  allIssues: readonly JiraIssueDto[],
  selectedTeams: readonly string[],
): TaskWorkloadRow[] {
  const issueByKey = new Map(allIssues.map(i => [i.key.toUpperCase(), i]));
  const byTask = new Map<string, { seconds: number; contributors: Map<string, TaskPersonContribution> }>();

  for (const item of analysis) {
    for (const row of item.issueBreakdown ?? []) {
      const key = row.issueKey.toUpperCase();
      const issue = issueByKey.get(key);
      if (!clockworkRowMatchesTeam(issue, allIssues, selectedTeams)) continue;

      const entry = byTask.get(key) ?? { seconds: 0, contributors: new Map() };
      entry.seconds += row.seconds;

      const existing = entry.contributors.get(item.user.accountId);
      if (existing) {
        existing.seconds += row.seconds;
      } else {
        entry.contributors.set(item.user.accountId, {
          accountId: item.user.accountId,
          displayName: item.user.displayName,
          avatarUrl: item.user.avatarUrl,
          seconds: row.seconds,
        });
      }

      byTask.set(key, entry);
    }
  }

  const totalSeconds = [...byTask.values()].reduce((sum, entry) => sum + entry.seconds, 0);
  const tasks: TaskWorkloadRow[] = [];

  for (const [key, data] of byTask.entries()) {
    const issue = issueByKey.get(key);
    const contributors = [...data.contributors.values()].sort((a, b) => b.seconds - a.seconds);
    tasks.push({
      issueKey: issue?.key ?? rowIssueKey(itemIssueBreakdown(analysis, key), key),
      summary: issue?.summary ?? key,
      totalSeconds: data.seconds,
      percentOfTeam: totalSeconds > 0 ? Math.round((data.seconds / totalSeconds) * 100) : 0,
      contributors,
    });
  }

  tasks.sort((a, b) => b.totalSeconds - a.totalSeconds);
  return tasks;
}

function itemIssueBreakdown(
  analysis: readonly UserAnalysis[],
  normalizedKey: string,
): readonly IssueWorklogBreakdown[] {
  for (const item of analysis) {
    if (item.issueBreakdown?.some(r => r.issueKey.toUpperCase() === normalizedKey)) {
      return item.issueBreakdown;
    }
  }
  return [];
}

export function formatWorklogHours(seconds: number): string {
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function computeBiweeklyKpis(
  tasks: readonly JiraIssueDto[],
  delivered: readonly CompletedTaskRow[],
  atRisk: readonly AtRiskTaskRow[],
  from: string,
  to: string,
): BiweeklyKpis {
  let storyPointsDelivered = 0;
  for (const row of delivered) {
    if (row.issue.storyPoints != null) storyPointsDelivered += Number(row.issue.storyPoints);
  }

  let returnsCount = 0;
  for (const issue of tasks) {
    returnsCount += returnsInPeriod(issue, from, to);
  }

  let startedCount = 0;
  for (const issue of tasks) {
    if (enteredInProgressInPeriod(issue, from, to)) startedCount += 1;
  }

  return {
    deliveredCount: delivered.length,
    storyPointsDelivered,
    inFlightCount: tasks.filter(i => metricBucketForIssue(i.status) === 'inFlight').length,
    blockedCount: atRisk.filter(r => r.reason === 'blocked').length,
    returnsCount,
    startedCount,
    activeTaskCount: tasks.length,
  };
}
