import type { Note } from '../entities/Note';
import type { Tag } from '../value-objects/Tag';
import type { WikiLink } from '../value-objects/WikiLink';

export interface INoteRepository {
  findByProjectId(projectId: string): Promise<Note[]>;
  findAll(): Promise<Note[]>;
  findById(id: string): Promise<Note | null>;
  /** Absolutna ścieżka pliku lub null */
  findFilePathById(id: string): Promise<string | null>;
  readBody(id: string): Promise<string | null>;
  noteSlugExists(projectId: string, slug: string): Promise<boolean>;
  save(note: Note, tags: Tag[], links: WikiLink[], aliases: string[], body: string): Promise<void>;
  delete(id: string): Promise<void>;
  getNoteAttachmentDir(id: string): Promise<string | null>;
}
