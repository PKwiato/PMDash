import type {
  ClockworkWorklog,
  IJiraAdapter,
  JiraBoard,
  JiraBoardProgress,
  JiraBoardProject,
  JiraIssue,
  JiraSprint,
  JiraUser,
} from '../../domain/ports/IJiraAdapter';
import { JiraApiClient } from './JiraApiClient';
import { JiraResponseMapper } from './JiraResponseMapper';

export class JiraApiAdapter implements IJiraAdapter {
  constructor(private readonly client: JiraApiClient) {}

  async listBoards(): Promise<JiraBoard[]> {
    const out: JiraBoard[] = [];
    let startAt = 0;
    const maxResults = 50;
    
    for (let page = 0; page < 20; page++) { // Limit to 1000 boards to prevent infinite loop
      const data = await this.client.get<{ 
        values: Array<Record<string, unknown>>;
        isLast?: boolean;
      }>(
        '/board',
        { startAt: String(startAt), maxResults: String(maxResults) },
        'agile',
      );
      
      const boards = data.values.map(b => ({
        id: b.id as number,
        name: b.name as string,
        projectKey: (b.location as { projectKey?: string } | undefined)?.projectKey ?? '',
        type: b.type as string,
      }));
      
      out.push(...boards);
      
      if (data.isLast === true || data.values.length < maxResults) break;
      startAt += maxResults;
    }
    
    return out;
  }

  async listBoardProjects(boardId: number): Promise<JiraBoardProject[]> {
    const out: JiraBoardProject[] = [];
    let startAt = 0;
    const maxResults = 50;
    for (let page = 0; page < 20; page++) {
      const data = await this.client.get<{
        values: Array<{ id: string | number; key: string; name: string }>;
        isLast?: boolean;
      }>(`/board/${boardId}/project`, { startAt: String(startAt), maxResults: String(maxResults) }, 'agile');
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
        fields: 'summary,description,status,assignee,priority,parent,issuetype,customfield_10014,issuelinks,subtasks,customfield_10004',
        maxResults: '200',
      },
      'agile',
    );
    return data.issues.map(i => JiraResponseMapper.toIssue(i as never));
  }

  async listBoardSprints(boardId: number): Promise<JiraSprint[]> {
    const data = await this.client.get<{ values: Array<Record<string, unknown>> }>(
      `/board/${boardId}/sprint`,
      { state: 'active,future' },
      'agile',
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
      fields: 'summary,description,status,assignee,priority,parent,issuetype,customfield_10014,comment,issuelinks,subtasks,customfield_10004',
    });
    return JiraResponseMapper.toIssue(data as never);
  }

  async getBoardProgress(projectKey: string): Promise<JiraBoardProgress> {
    const jql = `project = "${projectKey}" ORDER BY status`;
    const data = await this.client.get<{
      issues: Array<{ fields: { status: { name: string } } }>;
    }>('/search/jql', {
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

  async listIssuesByKeys(keys: string[]): Promise<JiraIssue[]> {
    if (keys.length === 0) return [];
    const jql = `key in ("${keys.join('","')}")`;
    const data = await this.client.get<{ issues: Array<Record<string, unknown>> }>(
      '/search/jql',
      {
        jql,
        fields: 'summary,description,status,assignee,priority,parent,issuetype,customfield_10014,comment,issuelinks,subtasks,customfield_10004',
        maxResults: String(keys.length),
      },
    );
    return data.issues.map(i => JiraResponseMapper.toIssue(i as never));
  }

  async listClockworkWorklogs(startingAt: string, endingAt: string, userAccountId?: string, projectKeys?: string[]): Promise<ClockworkWorklog[]> {
    // 1. Find all issues that have worklogs in the date range, restricted to specific projects if provided
    let jql = `worklogDate >= "${startingAt}" AND worklogDate <= "${endingAt}"`;
    if (projectKeys && projectKeys.length > 0) {
      jql = `project in (${projectKeys.join(',')}) AND ${jql}`;
    }

    const data = await this.client.get<{ issues: Array<{ id: string; key: string }> }>(
      '/search/jql',
      { jql, fields: 'key', maxResults: '100' },
      'api'
    );

    const out: ClockworkWorklog[] = [];
    
    // 2. For each issue, fetch its worklogs
    // Note: This can be slow for many issues, but it's the most reliable way without a dedicated Clockwork token.
    for (const issue of data.issues) {
      const wlData = await this.client.get<{ worklogs: Array<Record<string, any>> }>(
        `/issue/${issue.key}/worklog`,
        {},
        'api'
      );

      for (const w of wlData.worklogs) {
        const startedDate = w.started.split('T')[0];
        if (startedDate >= startingAt && startedDate <= endingAt) {
          if (!userAccountId || w.author.accountId === userAccountId) {
            out.push({
              id: Number(w.id),
              issueKey: issue.key,
              userAccountId: w.author.accountId,
              userName: w.author.displayName,
              date: startedDate,
              timeSpentSeconds: w.timeSpentSeconds,
              description: w.comment || '',
              started: w.started,
            });
          }
        }
      }
    }
    return out;
  }

  async listBoardUsers(boardId: number): Promise<JiraUser[]> {
    const userMap = new Map<string, JiraUser>();

    try {
      // 1. Get board name
      const board = await this.client.get<any>(`/board/${boardId}`, {}, 'agile').catch(() => ({ name: 'Unknown' }));
      const boardName = board.name || 'Unknown';
      
      // 2. Try group search (Collector, Base, etc.)
      const groupNames = [boardName, boardName.toLowerCase(), `team-${boardName.toLowerCase()}`];
      for (const gn of groupNames) {
        try {
          const res = await this.client.get<{ values: any[] }>('/group/member', { groupname: gn, maxResults: '50' }, 'api');
          if (res.values && res.values.length > 0) {
            for (const u of res.values) {
              if (u.accountId) userMap.set(u.accountId, { accountId: u.accountId, displayName: u.displayName, avatarUrl: u.avatarUrls?.['32x32'] });
            }
            break;
          }
        } catch (e) {}
      }

      // 3. Activity Fallback (if group search didn't find enough people)
      if (userMap.size < 2) {
        const projects = await this.listBoardProjects(boardId).catch(() => []);
        if (projects.length > 0) {
          const projectKeys = projects.map(p => p.key);
          const boardIssues = await this.listBoardIssues(boardId).catch(() => []);
          for (const issue of boardIssues) {
            if (issue.assignee) {
              userMap.set(issue.assignee.accountId, { accountId: issue.assignee.accountId, displayName: issue.assignee.displayName, avatarUrl: issue.assignee.avatarUrl });
            }
          }
        }
      }

      // 4. GLOBAL EXCLUSION FILTER (Request from USER)
      // Always remove these specific users as they shouldn't be in the analysis
      const toExclude = [
        'Kołodziej', 
        'Kolodziej',
        'Konieczny',
        'Augustyn'
      ];
      
      for (const [id, user] of userMap.entries()) {
        const name = user.displayName || '';
        if (toExclude.some(ex => name.includes(ex))) {
          userMap.delete(id);
        }
      }
    } catch (error) {
      console.error('Final fallback error in listBoardUsers:', error);
    }

    return Array.from(userMap.values());
  }
}
