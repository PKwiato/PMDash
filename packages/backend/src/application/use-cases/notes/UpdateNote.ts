import { NoteNotFoundError } from '../../../domain/errors/NoteNotFoundError';
import { ProjectNotFoundError } from '../../../domain/errors/ProjectNotFoundError';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import type { Note } from '../../../domain/entities/Note';
import { AutoTagBuilder } from '../../../domain/value-objects/AutoTagBuilder';

export interface UpdateNoteDTO {
  id: string;
  title?: string;
  body: string;
}

export class UpdateNote {
  constructor(
    private readonly noteRepo: INoteRepository,
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(dto: UpdateNoteDTO): Promise<Note> {
    const note = await this.noteRepo.findById(dto.id);
    if (!note) throw new NoteNotFoundError(dto.id);

    const project = await this.projectRepo.findById(note.projectId);
    if (!project) throw new ProjectNotFoundError(note.projectId);

    let next: Note =
      dto.title != null && dto.title !== note.title ? note.withTitle(dto.title) : note.bumpUpdated();

    const tags = AutoTagBuilder.forNote(next, project.slug);
    await this.noteRepo.save(next, tags, [], [next.title, next.slug], dto.body);
    return next;
  }
}
