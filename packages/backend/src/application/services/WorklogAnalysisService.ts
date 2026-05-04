import { ClockworkWorklog, IJiraAdapter, JiraUser } from '../../domain/ports/IJiraAdapter';

export interface WorklogInconsistency {
  type: 'missing_hours' | 'overtime' | 'weekend_work' | 'overlap';
  date: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface UserAnalysis {
  user: JiraUser;
  totalSeconds: number;
  inconsistencies: WorklogInconsistency[];
}

export class WorklogAnalysisService {
  constructor(private readonly jiraAdapter: IJiraAdapter) {}

  async analyzeBoard(boardId: number, dateFrom: string, dateTo: string): Promise<UserAnalysis[]> {
    // 1. Get board projects and users
    const projects = await this.jiraAdapter.listBoardProjects(boardId);
    const users = await this.jiraAdapter.listBoardUsers(boardId);
    if (users.length === 0) return [];

    const userMap = new Map<string, JiraUser>();
    users.forEach(u => userMap.set(u.accountId, u));

    const projectKeys = projects.map(p => p.key);

    // 2. Get worklogs for the period, filtered by board projects
    const allWorklogs = await this.jiraAdapter.listClockworkWorklogs(dateFrom, dateTo, undefined, projectKeys);

    // 3. Group worklogs by user and date
    const worklogsByUser: Record<string, ClockworkWorklog[]> = {};
    for (const user of users) {
      worklogsByUser[user.accountId] = allWorklogs.filter(w => w.userAccountId === user.accountId);
    }

    const analysis: UserAnalysis[] = [];

    for (const user of users) {
      const userLogs = worklogsByUser[user.accountId] || [];
      const userInconsistencies: WorklogInconsistency[] = [];
      
      // Calculate total seconds
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
          if (dailyHours < 7 && dailyHours > 0) {
            userInconsistencies.push({
              type: 'missing_hours',
              date: dateStr,
              details: `Only ${dailyHours.toFixed(1)}h reported (expected min 7h).`,
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
      });
    }

    return analysis;
  }
}
