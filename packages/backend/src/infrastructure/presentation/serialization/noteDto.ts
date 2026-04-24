import type { Note } from '../../../domain/entities/Note';

export function noteToListJson(n: Note) {
  return {
    id: n.id,
    title: n.title,
    slug: n.slug,
    projectId: n.projectId,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}
