import { v4 as uuid } from 'uuid';
import slugify from 'slugify';
import { Note } from '../../../domain/entities/Note';
import { ProjectNotFoundError } from '../../../domain/errors/ProjectNotFoundError';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { AutoTagBuilder } from '../../../domain/value-objects/AutoTagBuilder';

export interface CreateNoteDTO {
  projectId: string;
  title: string;
  body?: string;
}

export class CreateNote {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly noteRepo: INoteRepository,
  ) {}

  async execute(dto: CreateNoteDTO): Promise<Note> {
    const project = await this.projectRepo.findById(dto.projectId);
    if (!project) throw new ProjectNotFoundError(dto.projectId);

    const baseSlug = slugify(dto.title, { lower: true, strict: true }) || 'note';
    let slug = baseSlug;
    for (let i = 0; i < 50; i++) {
      if (!(await this.noteRepo.noteSlugExists(dto.projectId, slug))) break;
      slug = `${baseSlug}-${uuid().slice(0, 8)}`;
    }

    const now = new Date();
    const note = new Note(uuid(), dto.title, slug, dto.projectId, [], now, now);
    const tags = AutoTagBuilder.forNote(note, project.slug);
    const body = (dto.body ?? '').trim() || '## Treść\n\n';

    await this.noteRepo.save(note, tags, [], [dto.title], body);
    return note;
  }
}
