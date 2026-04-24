import type { Epic } from '../entities/Epic';
import type { Project } from '../entities/Project';
import type { Task } from '../entities/Task';
import type { Tag } from '../value-objects/Tag';

export interface TagWithCount {
  tag: Tag;
  count: number;
}

export interface TaggedItems {
  projects: Project[];
  epics: Epic[];
  tasks: Task[];
}

export interface ITagRepository {
  findAll(): Promise<TagWithCount[]>;
  findByTag(tagSlug: string): Promise<TaggedItems>;
}
