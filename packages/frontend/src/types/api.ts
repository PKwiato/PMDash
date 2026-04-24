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
}

export interface NoteDetail extends NoteListItem {
  body: string;
}
