import type { Tag } from '../value-objects/Tag';

export class Note {
  constructor(
    public readonly id: string,
    public title: string,
    public slug: string,
    public readonly projectId: string,
    public userTags: Tag[],
    public createdAt: Date,
    public updatedAt: Date,
    public body?: string,
    public readonly pinned = false,
    public readonly archived = false,
  ) {}

  withTitle(title: string): Note {
    return new Note(
      this.id,
      title,
      this.slug,
      this.projectId,
      this.userTags,
      this.createdAt,
      new Date(),
      this.body,
      this.pinned,
      this.archived,
    );
  }

  bumpUpdated(): Note {
    return new Note(
      this.id,
      this.title,
      this.slug,
      this.projectId,
      this.userTags,
      this.createdAt,
      new Date(),
      this.body,
      this.pinned,
      this.archived,
    );
  }

  withPinned(pinned: boolean): Note {
    return new Note(
      this.id,
      this.title,
      this.slug,
      this.projectId,
      this.userTags,
      this.createdAt,
      new Date(),
      this.body,
      pinned,
      this.archived,
    );
  }

  withArchived(archived: boolean): Note {
    return new Note(
      this.id,
      this.title,
      this.slug,
      this.projectId,
      this.userTags,
      this.createdAt,
      new Date(),
      this.body,
      this.pinned,
      archived,
    );
  }
}
