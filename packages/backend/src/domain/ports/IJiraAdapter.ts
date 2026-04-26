export interface JiraBoard {
  id: number;
  name: string;
  projectKey: string;
  type: string;
}

export interface JiraComment {
  id: string;
  author: string;
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
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description: string | null;
  status: string;
  assignee: string | null;
  priority: string;
  issueType: string;
  epicKey: string | null;
  comments?: JiraComment[];
  linkedIssues?: JiraLinkedIssue[];
  subtasks?: JiraLinkedIssue[];
  storyPoints?: number | null;
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

export interface IJiraAdapter {
  listBoards(): Promise<JiraBoard[]>;
  listBoardProjects(boardId: number): Promise<JiraBoardProject[]>;
  listBoardIssues(boardId: number, sprintId?: number): Promise<JiraIssue[]>;
  listBoardSprints(boardId: number): Promise<JiraSprint[]>;
  getIssue(issueKey: string): Promise<JiraIssue>;
  listIssuesByKeys(keys: string[]): Promise<JiraIssue[]>;
  getBoardProgress(projectKey: string): Promise<JiraBoardProgress>;
}
