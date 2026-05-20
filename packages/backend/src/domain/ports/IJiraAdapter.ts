export interface JiraBoard {
  id: number;
  name: string;
  projectKey: string;
  type: string;
}

export interface JiraComment {
  id: string;
  author: string;
  authorAvatarUrl: string | null;
  body: string;
  created: string;
}

export interface JiraLinkedIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  issueType: string;
  /** Raw Jira epic color token (e.g. ghx-label-10) or hex. */
  color?: string | null;
}

export interface JiraChangelogItem {
  field: string;
  fromString: string | null;
  toString: string | null;
}

export interface JiraChangelogHistory {
  id: string;
  created: string;
  author: string | null;
  items: JiraChangelogItem[];
}

export interface JiraStatusDwell {
  status: string;
  businessDays: number;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description: string | null;
  status: string;
  assignee: string | null;
  assigneeAvatarUrl: string | null;
  priority: string;
  issueType: string;
  epicKey: string | null;
  /** Epic color from Jira (customfield_10013), when set on this issue. */
  epicColor?: string | null;
  parent?: JiraLinkedIssue | null;
  comments?: JiraComment[];
  linkedIssues?: JiraLinkedIssue[];
  subtasks?: JiraLinkedIssue[];
  storyPoints?: number | null;
  created?: string;
  changelog?: JiraChangelogHistory[];
  statusDwellBusinessDays?: JiraStatusDwell[];
  /** Business days in the current Jira status since the last transition (UTC weekdays). */
  currentStatusBusinessDays?: number;
  /** Liczba powrotów taska z kolumn prawych do lewych (np. z testów do dev). */
  returnsCount?: number;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate: string;
  endDate: string;
}

export interface JiraBoardProgress {
  total: number;
  byStatus: Record<string, number>;
}

/** Projekty Jiry powiązane z boardem (Agile GET /board/{id}/project). */
export interface JiraBoardProject {
  id: string;
  key: string;
  name: string;
}

export interface ClockworkWorklog {
  id: number;
  issueKey: string;
  userAccountId: string;
  userName: string;
  date: string;
  timeSpentSeconds: number;
  description: string;
  started?: string; // ISO datetime
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl?: string;
}

export interface IJiraAdapter {
  listBoards(): Promise<JiraBoard[]>;
  listBoardProjects(boardId: number): Promise<JiraBoardProject[]>;
  listBoardIssues(boardId: number, sprintId?: number, options?: { includeChangelog?: boolean }): Promise<JiraIssue[]>;
  listBoardSprints(boardId: number): Promise<JiraSprint[]>;
  getIssue(issueKey: string, options?: { includeChangelog?: boolean }): Promise<JiraIssue>;
  listIssuesByKeys(keys: string[], options?: { includeChangelog?: boolean }): Promise<JiraIssue[]>;
  getBoardProgress(projectKey: string): Promise<JiraBoardProgress>;
  listClockworkWorklogs(startingAt: string, endingAt: string, userAccountIds?: string[] | string, projectKeys?: string[]): Promise<ClockworkWorklog[]>;
  listBoardUsers(boardId: number): Promise<JiraUser[]>;
}
