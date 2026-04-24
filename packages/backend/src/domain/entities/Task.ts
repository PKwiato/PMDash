import type { Tag } from '../value-objects/Tag';

export class Task {
  constructor(
    public readonly id: string,
    public title: string,
    public slug: string,
    public projectId: string,
    public epicId: string | null,
    public status: 'todo' | 'in-progress' | 'review' | 'blocked' | 'done',
    public priority: 'low' | 'medium' | 'high' | 'critical',
    public description: string,
    public jiraIssueKey: string | null,
    public jiraIssueId: string | null,
    public jiraStatus: string | null,
    public jiraAssignee: string | null,
    public jiraSyncedAt: Date | null,
    public estimatedHours: number,
    public userTags: Tag[],
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  linkJira(issueKey: string, issueId: string, jiraStatus: string, assignee: string | null): Task {
    return new Task(
      this.id,
      this.title,
      this.slug,
      this.projectId,
      this.epicId,
      this.status,
      this.priority,
      this.description,
      issueKey,
      issueId,
      jiraStatus,
      assignee,
      new Date(),
      this.estimatedHours,
      this.userTags,
      this.createdAt,
      new Date(),
    );
  }

  syncFromJira(jiraStatus: string, assignee: string | null): Task {
    return new Task(
      this.id,
      this.title,
      this.slug,
      this.projectId,
      this.epicId,
      this.status,
      this.priority,
      this.description,
      this.jiraIssueKey,
      this.jiraIssueId,
      jiraStatus,
      assignee,
      new Date(),
      this.estimatedHours,
      this.userTags,
      this.createdAt,
      new Date(),
    );
  }
}
