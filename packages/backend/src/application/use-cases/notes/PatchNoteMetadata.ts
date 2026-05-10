import { NoteNotFoundError } from '../../../domain/errors/NoteNotFoundError';
import { ProjectNotFoundError } from '../../../domain/errors/ProjectNotFoundError';
import type { Note } from '../../../domain/entities/Note';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { AutoTagBuilder } from '../../../domain/value-objects/AutoTagBuilder';

export interface PatchNoteMetadataDTO {
  id: string;
  pinned?: boolean;
  archived?: boolean;
}

export class PatchNoteMetadata {
  constructor(
    private readonly noteRepo: INoteRepository,
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(dto: PatchNoteMetadataDTO): Promise<Note> {
    const note = await this.noteRepo.findById(dto.id);
    if (!note) throw new NoteNotFoundError(dto.id);

    const project = await this.projectRepo.findById(note.projectId);
    if (!project) throw new ProjectNotFoundError(note.projectId);

    const body = await this.noteRepo.readBody(dto.id);
    if (body === null) throw new NoteNotFoundError(dto.id);

    let next = note.bumpUpdated();
    if (dto.pinned !== undefined) {
      next = next.withPinned(dto.pinned);
    }
    if (dto.archived !== undefined) {
      next = next.withArchived(dto.archived);
    }

    const tags = AutoTagBuilder.forNote(next, project.slug);
    await this.noteRepo.save(next, tags, [], [next.title, next.slug], body);
    return next;
  }
}
