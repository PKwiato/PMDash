import fg from 'fast-glob';
import type { ITagRepository, TagWithCount, TaggedItems } from '../../domain/ports/ITagRepository';
import { Tag, TagCategory } from '../../domain/value-objects/Tag';
import { InvalidTagError } from '../../domain/errors/InvalidTagError';
import type { AppConfig } from '../config/ConfigStore';
import { FrontmatterParser } from './FrontmatterParser';

export class StructuredTagModificationError extends Error {
  constructor(slug: string) {
    super(`Cannot modify structured tag: ${slug}`);
    this.name = 'StructuredTagModificationError';
  }
}

export class MarkdownTagRepository implements ITagRepository {
  constructor(
    private readonly config: AppConfig,
    private readonly parser: FrontmatterParser,
  ) {}

  private get dataDir(): string {
    return this.config.vault.activeMode === 'production'
      ? this.config.vault.productionDir
      : this.config.vault.testDir;
  }

  private async listNoteFiles(): Promise<string[]> {
    return fg('projects/*/notes/*.md', {
      cwd: this.dataDir.replace(/\\/g, '/'),
      onlyFiles: true,
      absolute: true,
    });
  }

  async findAll(): Promise<TagWithCount[]> {
    const files = await this.listNoteFiles();
    const counts = new Map<string, number>();

    for (const filePath of files) {
      try {
        const data = await this.parser.parseFile(filePath);
        if (data.type !== 'note') continue;
        const tags = this.parser.parseTags(data);
        for (const tag of tags) {
          counts.set(tag.slug, (counts.get(tag.slug) ?? 0) + 1);
        }
      } catch {
        /* skip malformed */
      }
    }

    const result: TagWithCount[] = [];
    for (const [slug, count] of counts.entries()) {
      try {
        result.push({ tag: Tag.of(slug), count });
      } catch {
        /* skip invalid */
      }
    }

    return result.sort((a, b) => {
      if (a.tag.category !== b.tag.category) {
        return a.tag.category.localeCompare(b.tag.category);
      }
      return a.tag.slug.localeCompare(b.tag.slug);
    });
  }

  async findByTag(_tagSlug: string): Promise<TaggedItems> {
    return { projects: [], epics: [], tasks: [] };
  }

  async renameInNotes(oldSlug: string, newSlug: string): Promise<{ updated: number }> {
    if (!Tag.isValid(oldSlug)) throw new InvalidTagError(oldSlug);
    if (!Tag.isValid(newSlug)) throw new InvalidTagError(newSlug);

    const oldTag = Tag.of(oldSlug);
    const newTag = Tag.of(newSlug);

    if (oldTag.category !== TagCategory.CUSTOM) {
      throw new StructuredTagModificationError(oldSlug);
    }
    if (newTag.category !== TagCategory.CUSTOM) {
      throw new StructuredTagModificationError(newSlug);
    }

    return this.mutateNoteTags(oldTag.slug, raw =>
      Array.from(new Set(raw.map(t => (t === oldTag.slug ? newTag.slug : t)))),
    );
  }

  async deleteFromNotes(slug: string): Promise<{ updated: number }> {
    if (!Tag.isValid(slug)) throw new InvalidTagError(slug);
    const tag = Tag.of(slug);
    if (tag.category !== TagCategory.CUSTOM) {
      throw new StructuredTagModificationError(slug);
    }

    return this.mutateNoteTags(tag.slug, raw => raw.filter(t => t !== tag.slug));
  }

  private async mutateNoteTags(
    triggerSlug: string,
    transform: (tags: string[]) => string[],
  ): Promise<{ updated: number }> {
    const files = await this.listNoteFiles();
    let updated = 0;

    for (const filePath of files) {
      try {
        const data = await this.parser.parseFile(filePath);
        if (data.type !== 'note') continue;

        const tagsRaw = data['tags'];
        if (!Array.isArray(tagsRaw)) continue;
        const stringTags = tagsRaw.filter((t): t is string => typeof t === 'string');
        if (!stringTags.includes(triggerSlug)) continue;

        const nextTags = transform(stringTags);
        const nextData: Record<string, unknown> = { ...data, tags: nextTags };

        await this.parser.updateFrontmatterOnly(filePath, nextData);
        updated++;
      } catch {
        /* skip */
      }
    }

    return { updated };
  }
}
