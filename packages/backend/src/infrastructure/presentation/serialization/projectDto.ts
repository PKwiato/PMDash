import type { Project } from '../../../domain/entities/Project';

export function isJiraLinked(p: Project): boolean {
  return p.jiraBoardId != null || p.jiraProjectKey != null;
}

export function projectToJson(p: Project) {
  const jiraLinked = isJiraLinked(p);
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    description: p.description,
    jiraBoardId: p.jiraBoardId,
    jiraBoardName: p.jiraBoardName,
    jiraProjectKey: p.jiraProjectKey,
    jiraLinked,
    source: jiraLinked ? ('jira' as const) : ('local' as const),
    tags: p.userTags.map(t => t.slug),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
