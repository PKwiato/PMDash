import type { JiraIssue } from '../../domain/ports/IJiraAdapter';

export class JiraResponseMapper {
  static toIssue(raw: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: { name: string };
      assignee?: { displayName: string } | null;
      priority?: { name: string } | null;
      issuetype: { name: string };
      description?: unknown;
      customfield_10014?: string | null;
      parent?: { key: string } | null;
    };
  }): JiraIssue {
    return {
      id: raw.id,
      key: raw.key,
      summary: raw.fields.summary,
      description: typeof raw.fields.description === 'string' ? raw.fields.description : raw.fields.description ? JSON.stringify(raw.fields.description) : null,
      status: raw.fields.status.name,
      assignee: raw.fields.assignee?.displayName ?? null,
      priority: raw.fields.priority?.name ?? 'Medium',
      issueType: raw.fields.issuetype.name,
      epicKey: raw.fields.customfield_10014 ?? raw.fields.parent?.key ?? null,
    };
  }
}
