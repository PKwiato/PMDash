import type {
  IJiraAdapter,
  JiraBoard,
  JiraBoardProgress,
  JiraBoardProject,
  JiraIssue,
  JiraSprint,
} from '../../domain/ports/IJiraAdapter';
import { JiraApiClient } from './JiraApiClient';
import { JiraResponseMapper } from './JiraResponseMapper';

export class JiraApiAdapter implements IJiraAdapter {
  constructor(private readonly client: JiraApiClient) {}

  async listBoards(): Promise<JiraBoard[]> {
    const data = await this.client.get<{ values: Array<Record<string, unknown>> }>(
      '/board',
      {},
      true,
    );
    return data.values.map(b => ({
      id: b.id as number,
      name: b.name as string,
      projectKey: (b.location as { projectKey?: string } | undefined)?.projectKey ?? '',
      type: b.type as string,
    }));
  }

  async listBoardProjects(boardId: number): Promise<JiraBoardProject[]> {
    const out: JiraBoardProject[] = [];
    let startAt = 0;
    const maxResults = 50;
    for (let page = 0; page < 20; page++) {
      const data = await this.client.get<{
        values: Array<{ id: string | number; key: string; name: string }>;
        isLast?: boolean;
      }>(`/board/${boardId}/project`, { startAt: String(startAt), maxResults: String(maxResults) }, true);
      for (const p of data.values) {
        out.push({ id: String(p.id), key: p.key, name: p.name });
      }
      if (data.isLast === true || data.values.length < maxResults) break;
      startAt += maxResults;
    }
    return out;
  }

  async listBoardIssues(boardId: number, sprintId?: number): Promise<JiraIssue[]> {
    const path = sprintId
      ? `/board/${boardId}/sprint/${sprintId}/issue`
      : `/board/${boardId}/issue`;
    const data = await this.client.get<{ issues: Array<Record<string, unknown>> }>(
      path,
      {
        fields: 'summary,status,assignee,priority,parent,issuetype,customfield_10014',
        maxResults: '200',
      },
      true,
    );
    return data.issues.map(i => JiraResponseMapper.toIssue(i as never));
  }

  async listBoardSprints(boardId: number): Promise<JiraSprint[]> {
    const data = await this.client.get<{ values: Array<Record<string, unknown>> }>(
      `/board/${boardId}/sprint`,
      { state: 'active,future' },
      true,
    );
    return data.values.map(s => ({
      id: s.id as number,
      name: s.name as string,
      state: s.state as string,
      startDate: (s.startDate as string) ?? '',
      endDate: (s.endDate as string) ?? '',
    }));
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    const data = await this.client.get<unknown>(`/issue/${issueKey}`, {
      fields: 'summary,status,assignee,priority,parent,issuetype,customfield_10014',
    });
    return JiraResponseMapper.toIssue(data as never);
  }

  async getBoardProgress(projectKey: string): Promise<JiraBoardProgress> {
    const jql = `project = "${projectKey}" ORDER BY status`;
    const data = await this.client.get<{
      issues: Array<{ fields: { status: { name: string } } }>;
    }>('/search', {
      jql,
      fields: 'status',
      maxResults: '500',
    });
    const byStatus: Record<string, number> = {};
    for (const issue of data.issues) {
      const statusName: string = issue.fields.status.name;
      byStatus[statusName] = (byStatus[statusName] ?? 0) + 1;
    }
    return { total: data.issues.length, byStatus };
  }
}
