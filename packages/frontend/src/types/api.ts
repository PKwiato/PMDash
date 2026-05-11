export interface ProjectDto {
  id: string;
  title: string;
  slug: string;
  status: string;
  description: string;
  jiraBoardId: number | null;
  jiraBoardName: string | null;
  jiraProjectKey: string | null;
  jiraLinked: boolean;
  source: 'local' | 'jira';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteListItem {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  body?: string;
  pinned?: boolean;
  archived?: boolean;
  tags?: string[];
}

export interface NoteDetail extends NoteListItem {
  body: string;
  tags: string[];
}

export interface TagSummary {
  slug: string;
  label: string;
  category: string;
  count: number;
  editable: boolean;
}

export const TAG_CATEGORY_CUSTOM = 'custom';

export const TAG_SLUG_REGEX = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;

export interface JiraBoardListItem {
  id: number;
  name: string;
  projectKey: string;
  type: string;
}

export interface JiraBoardProjectDto {
  id: string;
  key: string;
  name: string;
}

export interface JiraCommentDto {
  id: string;
  author: string;
  body: string;
  created: string;
}

export interface JiraLinkedIssueDto {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  issueType: string;
}

export interface JiraIssueDto {
  id: string;
  key: string;
  summary: string;
  description: string | null;
  status: string;
  assignee: string | null;
  priority: string;
  issueType: string;
  epicKey: string | null;
  comments?: JiraCommentDto[];
  linkedIssues?: JiraLinkedIssueDto[];
  subtasks?: JiraLinkedIssueDto[];
  storyPoints?: number | null;
}
