import type { Note } from '../../../domain/entities/Note';
import { AutoTagBuilder } from '../../../domain/value-objects/AutoTagBuilder';

export function noteToListJson(n: Note, projectSlug?: string) {
  const tags = projectSlug
    ? Array.from(new Set(AutoTagBuilder.forNote(n, projectSlug).map(t => t.slug)))
    : n.userTags.map(t => t.slug);

  return {
    id: n.id,
    title: n.title,
    slug: n.slug,
    projectId: n.projectId,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    body: n.body,
    pinned: n.pinned,
    archived: n.archived,
    tags,
  };
}
