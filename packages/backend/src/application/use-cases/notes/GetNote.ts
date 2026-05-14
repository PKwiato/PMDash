import { NoteNotFoundError } from '../../../domain/errors/NoteNotFoundError';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { AutoTagBuilder } from '../../../domain/value-objects/AutoTagBuilder';

export interface NoteWithBody {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  pinned: boolean;
  archived: boolean;
  tags: string[];
}

export class GetNote {
  constructor(
    private readonly noteRepo: INoteRepository,
    private readonly projectRepo?: IProjectRepository,
  ) {}

  async execute(id: string): Promise<NoteWithBody> {
    const note = await this.noteRepo.findById(id);
    if (!note) throw new NoteNotFoundError(id);

    const body = await this.noteRepo.readBody(id);
    if (body === null) throw new NoteNotFoundError(id);

    const project = this.projectRepo ? await this.projectRepo.findById(note.projectId) : null;
    const tags = project
      ? Array.from(new Set(AutoTagBuilder.forNote(note, project.slug).map(t => t.slug)))
      : note.userTags.map(t => t.slug);

    return {
      id: note.id,
      title: note.title,
      slug: note.slug,
      projectId: note.projectId,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      body,
      pinned: note.pinned,
      archived: note.archived,
      tags,
    };
  }
}
