import { NoteNotFoundError } from '../../../domain/errors/NoteNotFoundError';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';

export interface NoteWithBody {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  body: string;
}

export class GetNote {
  constructor(private readonly noteRepo: INoteRepository) {}

  async execute(id: string): Promise<NoteWithBody> {
    const note = await this.noteRepo.findById(id);
    if (!note) throw new NoteNotFoundError(id);

    const body = await this.noteRepo.readBody(id);
    if (body === null) throw new NoteNotFoundError(id);

    return {
      id: note.id,
      title: note.title,
      slug: note.slug,
      projectId: note.projectId,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      body,
    };
  }
}
