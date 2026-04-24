import type { Project } from '../entities/Project';
import type { Tag } from '../value-objects/Tag';
import type { WikiLink } from '../value-objects/WikiLink';

export interface IProjectRepository {
  findAll(): Promise<Project[]>;
  findAllArchived(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  findBySlug(slug: string): Promise<Project | null>;
  save(project: Project, tags: Tag[], links: WikiLink[], aliases: string[]): Promise<void>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
