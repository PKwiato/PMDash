import { InvalidTagError } from '../errors/InvalidTagError';

export enum TagCategory {
  PROJECT = 'project',
  EPIC = 'epic',
  STATUS = 'status',
  PRIORITY = 'priority',
  TYPE = 'type',
  JIRA = 'jira',
  AREA = 'area',
  SPRINT = 'sprint',
  CUSTOM = 'custom',
}

export class Tag {
  readonly slug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly parent: string | null;

  private constructor(slug: string) {
    this.slug = slug;
    const parts = slug.split('/');
    this.category = this.resolveCategory(parts[0] ?? '');
    this.parent = parts.length > 1 ? parts[0]! : null;
    this.label = parts[parts.length - 1]!.replace(/-/g, ' ');
  }

  static of(slug: string): Tag {
    if (!Tag.isValid(slug)) throw new InvalidTagError(slug);
    return new Tag(slug.toLowerCase().trim());
  }

  static isValid(slug: string): boolean {
    return /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(slug);
  }

  private resolveCategory(prefix: string): TagCategory {
    return (Object.values(TagCategory) as string[]).includes(prefix)
      ? (prefix as TagCategory)
      : TagCategory.CUSTOM;
  }

  equals(other: Tag): boolean {
    return this.slug === other.slug;
  }

  toString(): string {
    return this.slug;
  }
}
