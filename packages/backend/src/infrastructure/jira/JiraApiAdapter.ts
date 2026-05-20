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

const ISSUE_FIELDS =
  'summary,description,status,assignee,priority,parent,issuetype,customfield_10014,customfield_10013,comment,issuelinks,subtasks,customfield_10004,created';

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const worker = async () => {
    for (;;) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]!, idx);
    }
  };
  const pool = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: pool }, () => worker()));
  return results;
}

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

  async listBoardEpics(boardId: number): Promise<JiraIssue[]> {
    const out: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 50;
    for (let page = 0; page < 40; page++) {
      const data = await this.client.get<{
        values: Array<Record<string, unknown>>;
        isLast?: boolean;
      }>(`/board/${boardId}/epic`, { startAt: String(startAt), maxResults: String(maxResults) }, 'agile');
      for (const row of data.values) {
        out.push(this.mapBoardEpicRow(row));
      }
      if (data.isLast === true || data.values.length < maxResults) break;
      startAt += maxResults;
    }
    return out;
  }

  async listBoardPrograms(boardId: number): Promise<JiraIssue[]> {
    const projects = await this.listBoardProjects(boardId);
    if (projects.length === 0) return [];
    const keys = projects.map(p => `"${p.key}"`).join(', ');
    const issueTypes = await this.resolveProgramIssueTypeNames(projects);
    const quotedTypes = issueTypes.map(n => `"${n.replace(/"/g, '\\"')}"`).join(', ');
    const jql = `project in (${keys}) AND issuetype in (${quotedTypes}) ORDER BY summary`;
    return this.searchIssuesPaginated(jql);
  }

  private async resolveProgramIssueTypeNames(
    projects: JiraBoardProject[],
  ): Promise<string[]> {
    const names = new Set<string>(['Epic', 'Program', 'Initiative']);
    for (const project of projects) {
      try {
        const types = await this.client.get<Array<{ name?: string }>>('/issuetype/project', {
          projectId: project.id,
        });
        for (const t of types) {
          const name = typeof t.name === 'string' ? t.name.trim() : '';
          if (name && /epic|program|programme|initiative|portfolio/i.test(name)) {
            names.add(name);
          }
        }
      } catch {
        // keep defaults
      }
    }
    return [...names];
  }

  async listBoardIssues(boardId: number, sprintId?: number, options?: { includeChangelog?: boolean }): Promise<JiraIssue[]> {
    const path = sprintId
      ? `/board/${boardId}/sprint/${sprintId}/issue`
      : `/board/${boardId}/issue`;
    const fields =
      'summary,description,status,assignee,priority,parent,issuetype,customfield_10014,customfield_10013,issuelinks,subtasks,customfield_10004,created';
    const mapped: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 100;
    for (let page = 0; page < 50; page++) {
      const data = await this.client.get<{
        issues: Array<Record<string, unknown>>;
        isLast?: boolean;
      }>(path, { fields, maxResults: String(maxResults), startAt: String(startAt) }, 'agile');
      mapped.push(...data.issues.map(i => JiraResponseMapper.toIssue(i as never)));
      if (data.isLast === true || data.issues.length < maxResults) break;
      startAt += maxResults;
    }
    if (!options?.includeChangelog) {
      return mapped;
    }
    const uniq = [...new Set(mapped.map(i => i.key))];
    const encoded = uniq.map(k => encodeURIComponent(k));
    const raws = await mapWithConcurrency(encoded, 6, key => this.fetchRawIssueWithFullChangelog(key));
    const byKey = new Map(uniq.map((k, idx) => [k.toUpperCase(), raws[idx]!]));
    return mapped.map(issue => {
      const raw = byKey.get(issue.key.toUpperCase());
      return raw ? JiraResponseMapper.toIssue(raw as never) : issue;
    });
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

  async getIssue(issueKey: string, options?: { includeChangelog?: boolean }): Promise<JiraIssue> {
    const key = encodeURIComponent(issueKey);
    if (options?.includeChangelog) {
      const raw = await this.fetchRawIssueWithFullChangelog(key);
      return JiraResponseMapper.toIssue(raw as never);
    }
    const data = await this.client.get<unknown>(`/issue/${key}`, {
      fields: ISSUE_FIELDS,
    });
    return JiraResponseMapper.toIssue(data as never);
  }

  /** Loads issue JSON with `expand=changelog` and follows `/issue/{key}/changelog` pagination when needed. */
  private async fetchRawIssueWithFullChangelog(encodedIssueKey: string): Promise<Record<string, unknown>> {
    const data = await this.client.get<Record<string, unknown>>(`/issue/${encodedIssueKey}`, {
      fields: ISSUE_FIELDS,
      expand: 'changelog',
    });
    const changelog = data.changelog as
      | {
          histories?: Array<Record<string, unknown>>;
          total?: number;
        }
      | undefined;
    if (!changelog) {
      return data;
    }
    const histories: Array<Record<string, unknown>> = [...(changelog.histories ?? [])];
    let total = typeof changelog.total === 'number' ? changelog.total : histories.length;
    const pageSize = 100;
    let startAt = histories.length;
    while (startAt < total) {
      const page = await this.client.get<{
        histories?: Array<Record<string, unknown>>;
        total?: number;
      }>(`/issue/${encodedIssueKey}/changelog`, {
        startAt: String(startAt),
        maxResults: String(pageSize),
      });
      const batch = page.histories ?? [];
      histories.push(...batch);
      if (typeof page.total === 'number') {
        total = page.total;
      }
      if (batch.length === 0) break;
      startAt = histories.length;
    }
    histories.sort((a, b) => {
      const ca = String(a.created ?? '');
      const cb = String(b.created ?? '');
      if (ca !== cb) return ca < cb ? -1 : 1;
      return String(a.id ?? '').localeCompare(String(b.id ?? ''), undefined, { numeric: true });
    });
    return {
      ...data,
      changelog: {
        ...changelog,
        histories,
        startAt: 0,
        maxResults: histories.length,
        total: histories.length,
      },
    };
  }

  private mapBoardEpicRow(row: Record<string, unknown>): JiraIssue {
    const colorObj = row.color as { key?: string } | undefined;
    const colorKey = typeof colorObj?.key === 'string' ? colorObj.key : null;
    const name = typeof row.name === 'string' ? row.name : typeof row.summary === 'string' ? row.summary : String(row.key ?? '');
    const done = row.done === true;
    return {
      id: String(row.id ?? row.key ?? ''),
      key: String(row.key ?? ''),
      summary: name,
      description: null,
      status: done ? 'Done' : 'Open',
      assignee: null,
      assigneeAvatarUrl: null,
      priority: 'Medium',
      issueType: 'Epic',
      epicKey: null,
      epicColor: colorKey,
    };
  }

  private async searchIssuesPaginated(jql: string): Promise<JiraIssue[]> {
    const out: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 100;
    for (let page = 0; page < 50; page++) {
      const data = await this.client.get<{
        issues: Array<Record<string, unknown>>;
        isLast?: boolean;
      }>('/search/jql', { jql, fields: ISSUE_FIELDS, maxResults: String(maxResults), startAt: String(startAt) });
      out.push(...data.issues.map(i => JiraResponseMapper.toIssue(i as never)));
      if (data.isLast === true || data.issues.length < maxResults) break;
      startAt += maxResults;
    }
    return out;
  }

  private mergeIssueRecords(existing: JiraIssue, incoming: JiraIssue): JiraIssue {
    return {
      ...incoming,
      epicColor: incoming.epicColor ?? existing.epicColor,
      epicKey: incoming.epicKey ?? existing.epicKey,
      parent: incoming.parent ?? existing.parent,
      description: incoming.description ?? existing.description,
      changelog: incoming.changelog ?? existing.changelog,
      statusDwellBusinessDays: incoming.statusDwellBusinessDays ?? existing.statusDwellBusinessDays,
      currentStatusBusinessDays: incoming.currentStatusBusinessDays ?? existing.currentStatusBusinessDays,
      returnsCount: incoming.returnsCount ?? existing.returnsCount,
    };
  }

  /** Board issues + all board epics + project programs (deduped). */
  async listProgramsOverview(boardId: number): Promise<JiraIssue[]> {
    const [boardIssues, boardEpics, jqlPrograms] = await Promise.all([
      this.listBoardIssues(boardId, undefined, { includeChangelog: false }),
      this.listBoardEpics(boardId).catch(() => [] as JiraIssue[]),
      this.listBoardPrograms(boardId).catch(() => [] as JiraIssue[]),
    ]);
    const byKey = new Map<string, JiraIssue>();
    for (const issue of [...boardIssues, ...boardEpics, ...jqlPrograms]) {
      const k = issue.key.toUpperCase();
      const prev = byKey.get(k);
      byKey.set(k, prev ? this.mergeIssueRecords(prev, issue) : issue);
    }
    return [...byKey.values()];
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

  async listIssuesByKeys(keys: string[], options?: { includeChangelog?: boolean }): Promise<JiraIssue[]> {
    if (keys.length === 0) return [];

    if (options?.includeChangelog) {
      const trimmed = keys.map(k => k.trim()).filter(Boolean);
      const uniq = [...new Set(trimmed)];
      const encoded = uniq.map(k => encodeURIComponent(k));
      const raws = await mapWithConcurrency(encoded, 6, key => this.fetchRawIssueWithFullChangelog(key));
      const byKey = new Map(uniq.map((k, i) => [k.toUpperCase(), raws[i]!]));
      return trimmed.map(k => {
        const raw = byKey.get(k.toUpperCase());
        if (!raw) {
          throw new Error(`Missing Jira payload for key ${k}`);
        }
        return JiraResponseMapper.toIssue(raw as never);
      });
    }

    const uniq = [...new Set(keys.map(k => k.trim()).filter(Boolean))];
    const jql = `key in ("${uniq.join('","')}")`;
    const data = await this.client.get<{ issues: Array<Record<string, unknown>> }>(
      '/search/jql',
      {
        jql,
        fields: ISSUE_FIELDS,
        maxResults: String(uniq.length),
      },
    );
    return data.issues.map(i => JiraResponseMapper.toIssue(i as never));
  }

  async listClockworkWorklogs(startingAt: string, endingAt: string, userAccountIds?: string[] | string, projectKeys?: string[]): Promise<ClockworkWorklog[]> {
    // 1. Find all issues that have worklogs in the date range
    let jql = `worklogDate >= "${startingAt}" AND worklogDate <= "${endingAt}"`;
    
    if (projectKeys && projectKeys.length > 0) {
      jql = `project in (${projectKeys.join(',')}) AND ${jql}`;
    }

    if (userAccountIds) {
      const ids = Array.isArray(userAccountIds) ? userAccountIds : [userAccountIds];
      if (ids.length > 0) {
        jql = `worklogAuthor in ("${ids.join('","')}") AND ${jql}`;
      }
    }

    const data = await this.client.get<{ issues: Array<{ id: string; key: string }> }>(
      '/search/jql',
      { jql, fields: 'key', maxResults: '500' },
      'api'
    );

    const out: ClockworkWorklog[] = [];
    
    const targetUserIds = userAccountIds 
      ? (Array.isArray(userAccountIds) ? new Set(userAccountIds) : new Set([userAccountIds]))
      : null;

    // 2. For each issue, fetch its worklogs
    for (const issue of data.issues) {
      const wlData = await this.client.get<{ worklogs: Array<Record<string, unknown>> }>(
        `/issue/${issue.key}/worklog`,
        {},
        'api'
      );

      for (const w of wlData.worklogs) {
        const started = String(w.started ?? '');
        const startedDate = started.split('T')[0] ?? '';
        const author = w.author as { accountId?: string; displayName?: string } | undefined;
        const accountId = author?.accountId ?? '';
        if (!startedDate || startedDate < startingAt || startedDate > endingAt) continue;
        if (!targetUserIds || targetUserIds.has(accountId)) {
          const comment = w.comment;
          out.push({
            id: Number(w.id),
            issueKey: issue.key,
            userAccountId: accountId,
            userName: author?.displayName ?? '',
            date: startedDate,
            timeSpentSeconds: Number(w.timeSpentSeconds ?? 0),
            description: typeof comment === 'string' ? comment : '',
            started,
          });
        }
      }
    }
    return out;
  }

  async listBoardUsers(boardId: number): Promise<JiraUser[]> {
    const userMap = new Map<string, JiraUser>();

    try {
      // 1. Get board name
      const board = await this.client
        .get<{ name?: string }>(`/board/${boardId}`, {}, 'agile')
        .catch(() => ({ name: 'Unknown' }));
      const boardName = board.name || 'Unknown';
      
      // 2. Try group search (Collector, Base, Team Base, etc.)
      const groupNames = [
        boardName, 
        boardName.toLowerCase(), 
        `team-${boardName.toLowerCase()}`,
        `team ${boardName.toLowerCase()}`,
        boardName.replace('Team ', ''),
        boardName.replace('team ', '')
      ];
      for (const gn of groupNames) {
        try {
          const res = await this.client.get<{
            values?: Array<{
              accountId?: string;
              displayName?: string;
              avatarUrls?: Record<string, string>;
            }>;
          }>('/group/member', { groupname: gn, maxResults: '50' }, 'api');
          if (res.values && res.values.length > 0) {
            for (const u of res.values) {
              if (u.accountId) {
                userMap.set(u.accountId, {
                  accountId: u.accountId,
                  displayName: u.displayName ?? '',
                  avatarUrl: u.avatarUrls?.['32x32'],
                });
              }
            }
            break;
          }
        } catch {
          void 0;
        }
      }

      // 3. Activity Discovery removed as per user request to be group-strict

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
