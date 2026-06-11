import { ClockworkWorklog, IJiraAdapter, JiraUser } from '../../domain/ports/IJiraAdapter';
import type { IClockworkAdapter } from '../../domain/ports/IClockworkAdapter';

export interface WorklogInconsistency {
  type: 'missing_hours' | 'overtime' | 'weekend_work' | 'overlap';
  date: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface IssueWorklogBreakdown {
  issueKey: string;
  seconds: number;
  logCount: number;
}

export interface UserAnalysis {
  user: JiraUser;
  totalSeconds: number;
  inconsistencies: WorklogInconsistency[];
  issueBreakdown: IssueWorklogBreakdown[];
}

export async function hydrateClockworkIssueKeys(
  worklogs: readonly ClockworkWorklog[],
  resolveKeys: (issueIds: readonly string[]) => Promise<ReadonlyMap<string, string>>,
): Promise<ClockworkWorklog[]> {
  const idsNeedingKeys = [
    ...new Set(
      worklogs
        .filter(w => !w.issueKey.trim() && w.issueId)
        .map(w => w.issueId!.trim()),
    ),
  ];
  if (idsNeedingKeys.length === 0) return [...worklogs];

  const idToKey = await resolveKeys(idsNeedingKeys);
  return worklogs.map(w => {
    if (w.issueKey.trim() || !w.issueId) return w;
    const key = idToKey.get(w.issueId) ?? '';
    return key ? { ...w, issueKey: key } : w;
  });
}

function buildIssueBreakdown(logs: ClockworkWorklog[]): IssueWorklogBreakdown[] {
  const byKey = new Map<string, IssueWorklogBreakdown>();
  for (const log of logs) {
    const key = log.issueKey.trim();
    if (!key) continue;
    const normalized = key.toUpperCase();
    const existing = byKey.get(normalized) ?? { issueKey: key, seconds: 0, logCount: 0 };
    existing.seconds += log.timeSpentSeconds;
    existing.logCount += 1;
    byKey.set(normalized, existing);
  }
  return [...byKey.values()].sort((a, b) => b.seconds - a.seconds);
}

export class WorklogAnalysisService {
  constructor(
    private readonly jiraAdapter: IJiraAdapter,
    private readonly clockworkAdapter: IClockworkAdapter,
  ) {}

  async analyzeBoard(boardId: number, dateFrom: string, dateTo: string): Promise<UserAnalysis[]> {
    const users = await this.jiraAdapter.listBoardUsers(boardId);
    if (users.length === 0) return [];

    const userAccountIds = new Set(users.map(user => user.accountId));
    const rawWorklogs = await this.clockworkAdapter.listWorklogs(dateFrom, dateTo);
    const allWorklogs = await hydrateClockworkIssueKeys(
      rawWorklogs,
      ids => this.jiraAdapter.resolveIssueKeysByIds(ids),
    );

    const worklogsByUser: Record<string, ClockworkWorklog[]> = {};
    for (const user of users) {
      worklogsByUser[user.accountId] = allWorklogs.filter(
        worklog => worklog.userAccountId === user.accountId && userAccountIds.has(worklog.userAccountId),
      );
    }

    const analysis: UserAnalysis[] = [];

    for (const user of users) {
      const userLogs = worklogsByUser[user.accountId] || [];
      const userInconsistencies: WorklogInconsistency[] = [];

      const issueBreakdown = buildIssueBreakdown(userLogs);
      const totalSeconds = userLogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0);

      // Group by date for daily analysis
      const logsByDate: Record<string, ClockworkWorklog[]> = {};
      userLogs.forEach(w => {
        if (!logsByDate[w.date]) logsByDate[w.date] = [];
        logsByDate[w.date].push(w);
      });

      // Analyze each day in range
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dailyLogs = logsByDate[dateStr] || [];
        const dailySeconds = dailyLogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0);
        const dailyHours = dailySeconds / 3600;

        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        if (isWeekend) {
          if (dailySeconds > 0) {
            userInconsistencies.push({
              type: 'weekend_work',
              date: dateStr,
              details: `Reported ${dailyHours.toFixed(1)}h on a weekend.`,
              severity: 'low',
            });
          }
        } else {
          // Workday
          if (dailyHours < 6 && dailyHours > 0) {
            userInconsistencies.push({
              type: 'missing_hours',
              date: dateStr,
              details: `Only ${dailyHours.toFixed(1)}h reported (expected min 6h).`,
              severity: 'medium',
            });
          } else if (dailyHours === 0) {
            userInconsistencies.push({
              type: 'missing_hours',
              date: dateStr,
              details: `No hours reported.`,
              severity: 'high',
            });
          } else if (dailyHours > 9) {
            userInconsistencies.push({
              type: 'overtime',
              date: dateStr,
              details: `Reported ${dailyHours.toFixed(1)}h (exceeds 9h).`,
              severity: 'medium',
            });
          }
        }

        // Check for overlaps if start time is available
        // (Simplified overlap check: this requires precise start/end times which Clockwork usually has in 'started' and 'timeSpentSeconds')
        // For now skipping complex overlap logic until we confirm 'started' format.
      }

      analysis.push({
        user,
        totalSeconds,
        inconsistencies: userInconsistencies,
        issueBreakdown,
      });
    }

    return analysis;
  }
}
