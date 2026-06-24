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
import { isProgramIssueType } from '../../domain/jira/programIssueTypes';
import { JiraApiClient } from './JiraApiClient';
import { JiraResponseMapper } from './JiraResponseMapper';

const ISSUE_FIELDS_BASE =
  'summary,description,status,assignee,priority,parent,issuetype,customfield_10014,customfield_10013,comment,issuelinks,subtasks,customfield_10004,customfield_14054,created';

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
  private issueFieldsCache: string | null = null;
  private statscoreTeamFieldResolved = false;
  private statscoreTeamFieldId: string | null = null;
  private sprintFieldResolved = false;
  private sprintFieldId: string | null = null;

  constructor(private readonly client: JiraApiClient) {}

  private async resolveStatscoreTeamFieldId(): Promise<string | null> {
    if (this.statscoreTeamFieldResolved) return this.statscoreTeamFieldId;
    this.statscoreTeamFieldResolved = true;
    try {
      const fields = await this.client.get<Array<{ id?: string; name?: string }>>('/field');
      const match = fields.find(
        f => typeof f.name === 'string' && f.name.trim().toLowerCase() === 'statscore team',
      );
      this.statscoreTeamFieldId = typeof match?.id === 'string' ? match.id : null;
      JiraResponseMapper.setStatscoreTeamFieldId(this.statscoreTeamFieldId);
    } catch {
      this.statscoreTeamFieldId = null;
      JiraResponseMapper.setStatscoreTeamFieldId(null);
    }
    return this.statscoreTeamFieldId;
  }

  private async resolveSprintFieldId(): Promise<string | null> {
    if (this.sprintFieldResolved) return this.sprintFieldId;
    this.sprintFieldResolved = true;
    try {
      const fields = await this.client.get<Array<{ id?: string; name?: string; schema?: { custom?: string } }>>('/field');
      const match = fields.find(
        f =>
          typeof f.name === 'string' &&
          f.name.trim().toLowerCase() === 'sprint' &&
          f.schema?.custom === 'com.pyxis.greenhopper.jira:gh-sprint',
      );
      this.sprintFieldId = typeof match?.id === 'string' ? match.id : 'customfield_10007';
      JiraResponseMapper.setSprintFieldId(this.sprintFieldId);
    } catch {
      this.sprintFieldId = 'customfield_10007';
      JiraResponseMapper.setSprintFieldId('customfield_10007');
    }
    return this.sprintFieldId;
  }

  private async issueFields(): Promise<string> {
    if (this.issueFieldsCache) return this.issueFieldsCache;
    const [teamId, sprintId] = await Promise.all([
      this.resolveStatscoreTeamFieldId(),
      this.resolveSprintFieldId(),
    ]);
    let fields = ISSUE_FIELDS_BASE;
    if (teamId && !fields.includes(teamId)) fields += `,${teamId}`;
    if (sprintId && !fields.includes(sprintId)) fields += `,${sprintId}`;
    this.issueFieldsCache = fields;
    return this.issueFieldsCache;
  }

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
        const types = await this.client.get<Array<{ name?: string; hierarchyLevel?: number }>>(
          '/issuetype/project',
          { projectId: project.id },
        );
        for (const t of types) {
          const name = typeof t.name === 'string' ? t.name.trim() : '';
          if (!name) continue;
          if (t.hierarchyLevel === 1) names.add(name);
          if (/epic|program|programme|initiative|portfolio|theme|capability/i.test(name)) {
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
    const fields = await this.issueFields();
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
      fields: await this.issueFields(),
    });
    return JiraResponseMapper.toIssue(data as never);
  }

  /** Loads issue JSON with `expand=changelog` and follows `/issue/{key}/changelog` pagination when needed. */
  private async fetchRawIssueWithFullChangelog(encodedIssueKey: string): Promise<Record<string, unknown>> {
    const data = await this.client.get<Record<string, unknown>>(`/issue/${encodedIssueKey}`, {
      fields: await this.issueFields(),
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
    const maxResults = 100;
    const fields = await this.issueFields();
    let nextPageToken: string | undefined;
    for (let page = 0; page < 100; page++) {
      const params: Record<string, string> = { jql, fields, maxResults: String(maxResults) };
      if (nextPageToken) params.nextPageToken = nextPageToken;
      const data = await this.client.get<{
        issues: Array<Record<string, unknown>>;
        isLast?: boolean;
        nextPageToken?: string | null;
      }>('/search/jql', params);
      out.push(...data.issues.map(i => JiraResponseMapper.toIssue(i as never)));
      const token = data.nextPageToken;
      if (data.isLast === true || !token || data.issues.length === 0) break;
      nextPageToken = token;
    }
    return out;
  }

  private collectReferencedProgramKeys(issues: readonly JiraIssue[]): string[] {
    const keys = new Set<string>();
    for (const issue of issues) {
      if (issue.epicKey?.trim()) keys.add(issue.epicKey.trim());
      if (issue.parent?.key && isProgramIssueType(issue.parent.issueType)) {
        keys.add(issue.parent.key);
      }
    }
    return [...keys];
  }

  private collectProgramKeysFromMap(byKey: Map<string, JiraIssue>): string[] {
    return [...byKey.values()]
      .filter(i => isProgramIssueType(i.issueType))
      .map(i => i.key)
      .filter(Boolean);
  }

  /** Tasks linked via Epic Link / parent but not on the agile board. */
  private async fetchIssuesLinkedToPrograms(byKey: Map<string, JiraIssue>): Promise<void> {
    const programKeys = this.collectProgramKeysFromMap(byKey);
    if (programKeys.length === 0) return;

    const chunkSize = 40;
    for (let i = 0; i < programKeys.length; i += chunkSize) {
      const chunk = programKeys.slice(i, i + chunkSize);
      const quoted = chunk.join(', ');
      const jql = `("Epic Link" in (${quoted}) OR parent in (${quoted})) ORDER BY updated DESC`;
      try {
        const linked = await this.searchIssuesPaginated(jql);
        for (const issue of linked) {
          if (isProgramIssueType(issue.issueType)) continue;
          const k = issue.key.toUpperCase();
          const prev = byKey.get(k);
          byKey.set(k, prev ? this.mergeIssueRecords(prev, issue) : issue);
        }
      } catch {
        // fallback without Epic Link clause if field name differs
        const jqlParent = `parent in (${quoted}) ORDER BY updated DESC`;
        const linked = await this.searchIssuesPaginated(jqlParent);
        for (const issue of linked) {
          if (isProgramIssueType(issue.issueType)) continue;
          const k = issue.key.toUpperCase();
          const prev = byKey.get(k);
          byKey.set(k, prev ? this.mergeIssueRecords(prev, issue) : issue);
        }
      }
    }
  }

  private async fetchMissingProgramIssues(
    byKey: Map<string, JiraIssue>,
    boardIssues: readonly JiraIssue[],
  ): Promise<void> {
    const referenced = this.collectReferencedProgramKeys(boardIssues);
    const missing = referenced.filter(k => !byKey.has(k.toUpperCase()));
    if (missing.length === 0) return;
    const fetched = await this.listIssuesByKeys(missing);
    for (const issue of fetched) {
      const k = issue.key.toUpperCase();
      const prev = byKey.get(k);
      byKey.set(k, prev ? this.mergeIssueRecords(prev, issue) : issue);
    }
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
      statscoreTeam: incoming.statscoreTeam ?? existing.statscoreTeam,
    };
  }

  /** Board epics from Agile API lack custom fields (e.g. STATSCORE Team); load full issues. */
  private async enrichBoardEpicsInMap(
    byKey: Map<string, JiraIssue>,
    boardEpics: readonly JiraIssue[],
  ): Promise<void> {
    const keys = boardEpics.map(e => e.key).filter(Boolean);
    if (keys.length === 0) return;
    const enriched = await this.listIssuesByKeys(keys);
    for (const issue of enriched) {
      const k = issue.key.toUpperCase();
      const prev = byKey.get(k);
      byKey.set(k, prev ? this.mergeIssueRecords(prev, issue) : issue);
    }
  }

  /** Board issues + all board epics + project programs (deduped). */
  async listProgramsOverview(boardId: number): Promise<JiraIssue[]> {
    await this.resolveStatscoreTeamFieldId();
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
    await this.enrichBoardEpicsInMap(byKey, boardEpics);
    await this.fetchMissingProgramIssues(byKey, boardIssues);
    await this.fetchIssuesLinkedToPrograms(byKey);
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
      const raws = await mapWithConcurrency(encoded, 6, async key => {
        try {
          return await this.fetchRawIssueWithFullChangelog(key);
        } catch (err: unknown) {
          console.warn(`Failed to load changelog for issue ${key}:`, err);
          return null;
        }
      });
      const out: JiraIssue[] = [];
      for (let i = 0; i < uniq.length; i++) {
        const raw = raws[i];
        if (raw) {
          out.push(JiraResponseMapper.toIssue(raw as never));
        }
      }
      return out;
    }

    const uniq = [...new Set(keys.map(k => k.trim()).filter(Boolean))];
    const jql = `key in ("${uniq.join('","')}")`;
    const data = await this.client.get<{ issues: Array<Record<string, unknown>> }>(
      '/search/jql',
      {
        jql,
        fields: await this.issueFields(),
        maxResults: String(uniq.length),
      },
    );
    return data.issues.map(i => JiraResponseMapper.toIssue(i as never));
  }

  async resolveIssueKeysByIds(issueIds: readonly string[]): Promise<ReadonlyMap<string, string>> {
    const out = new Map<string, string>();
    const unique = [...new Set(issueIds.map(id => id.trim()).filter(Boolean))];
    const BATCH = 100;

    for (let i = 0; i < unique.length; i += BATCH) {
      const chunk = unique.slice(i, i + BATCH);
      const data = await this.client.post<{
        issues?: Array<{ id?: string; key?: string }>;
      }>('/issue/bulkfetch', {
        fields: ['key'],
        issueIdsOrKeys: chunk,
      });

      for (const issue of data.issues ?? []) {
        if (issue.id && issue.key) {
          out.set(String(issue.id), issue.key);
        }
      }
    }

    return out;
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
