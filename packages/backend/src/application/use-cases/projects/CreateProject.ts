import { v4 as uuid } from 'uuid';
import slugify from 'slugify';
import { Project } from '../../../domain/entities/Project';
import { DuplicateProjectSlugError } from '../../../domain/errors/DuplicateProjectSlugError';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { AutoTagBuilder } from '../../../domain/value-objects/AutoTagBuilder';
import { Tag } from '../../../domain/value-objects/Tag';
import { WikiLinkFactory } from '../../../domain/value-objects/WikiLink';

export interface CreateProjectDTO {
  title: string;
  description?: string;
  tags?: string[];
}

export class CreateProject {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async execute(dto: CreateProjectDTO): Promise<Project> {
    const slug = slugify(dto.title, { lower: true, strict: true });
    const existing = await this.projectRepo.findBySlug(slug);
    if (existing) throw new DuplicateProjectSlugError(slug);

    const project = new Project(
      uuid(),
      dto.title,
      slug,
      'active',
      dto.description ?? '',
      null,
      null,
      null,
      (dto.tags ?? []).map(t => Tag.of(t)),
      new Date(),
      new Date(),
    );

    const tags = AutoTagBuilder.forProject(project);
    const links = [WikiLinkFactory.globalIndex('all-tasks', 'Wszystkie taski')];
    const aliases = [project.title, slug.replace(/-/g, ' ')];

    await this.projectRepo.save(project, tags, links, aliases);
    return project;
  }
}
