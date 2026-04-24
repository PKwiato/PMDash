import type { Epic } from '../../domain/entities/Epic';
import type { IEpicRepository } from '../../domain/ports/IEpicRepository';
import type { Tag } from '../../domain/value-objects/Tag';
import type { WikiLink } from '../../domain/value-objects/WikiLink';

/** Placeholder — implementacja zgodna z `.cursor/PM_SYSTEM_SPEC.md` w kolejnych iteracjach */
export class MarkdownEpicRepository implements IEpicRepository {
  async findByProjectId(_projectId: string): Promise<Epic[]> {
    return [];
  }

  async findById(_id: string): Promise<Epic | null> {
    return null;
  }

  async save(_epic: Epic, _tags: Tag[], _links: WikiLink[], _aliases: string[]): Promise<void> {
    return;
  }

  async delete(_id: string): Promise<void> {
    return;
  }
}
