import { v4 as uuid } from 'uuid';
import slugify from 'slugify';
import { Note } from '../../../domain/entities/Note';
import { ProjectNotFoundError } from '../../../domain/errors/ProjectNotFoundError';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { AutoTagBuilder } from '../../../domain/value-objects/AutoTagBuilder';
import { Tag, TagCategory } from '../../../domain/value-objects/Tag';

export interface CreateNoteDTO {
  projectId: string;
  title: string;
  body?: string;
  userTags?: string[];
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

    const userTags = parseUserTagsInput(dto.userTags);

    const now = new Date();
    const note = new Note(uuid(), dto.title, slug, dto.projectId, userTags, now, now);
    const tags = AutoTagBuilder.forNote(note, project.slug);
    const body = (dto.body ?? '').trim() || '## Treść\n\n';

    await this.noteRepo.save(note, tags, [], [dto.title], body);
    return note;
  }
}

export function parseUserTagsInput(input: unknown): Tag[] {
  if (input === undefined) return [];
  if (!Array.isArray(input)) {
    throw new Error('userTags must be an array of strings');
  }
  const tags: Tag[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== 'string') {
      throw new Error('userTags must contain only strings');
    }
    const tag = Tag.of(raw.trim());
    if (tag.category !== TagCategory.CUSTOM) {
      throw new Error(`Tag "${tag.slug}" is reserved (structured tag); only custom tags allowed`);
    }
    if (seen.has(tag.slug)) continue;
    seen.add(tag.slug);
    tags.push(tag);
  }
  return tags;
}
