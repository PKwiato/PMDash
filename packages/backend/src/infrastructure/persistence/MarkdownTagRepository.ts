import type { ITagRepository, TagWithCount, TaggedItems } from '../../domain/ports/ITagRepository';

/** Placeholder — implementacja zgodna z `.cursor/PM_SYSTEM_SPEC.md` w kolejnych iteracjach */
export class MarkdownTagRepository implements ITagRepository {
  async findAll(): Promise<TagWithCount[]> {
    return [];
  }

  async findByTag(_tagSlug: string): Promise<TaggedItems> {
    return { projects: [], epics: [], tasks: [] };
  }
}
