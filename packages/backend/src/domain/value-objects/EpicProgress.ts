import type { Task } from '../entities/Task';

export interface JiraProgressSummary {
  jiraTotal: number;
  jiraDone: number;
  jiraInProgress: number;
  jiraPercentage: number;
  lastSyncedAt: string;
}

export class EpicProgress {
  readonly percentage: number;
  readonly jiraLinkedCount: number;

  constructor(
    public readonly total: number,
    public readonly done: number,
    public readonly inProgress: number,
    public readonly blocked: number,
    public readonly todo: number,
    tasks: Task[],
    public readonly jiraProgressSummary?: JiraProgressSummary,
  ) {
    this.percentage = total === 0 ? 0 : Math.round((done / total) * 100);
    this.jiraLinkedCount = tasks.filter(t => t.jiraIssueKey !== null).length;
  }
}
