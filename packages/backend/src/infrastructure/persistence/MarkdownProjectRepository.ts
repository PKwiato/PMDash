import * as fs from 'fs-extra';
import * as path from 'path';
import { Project } from '../../domain/entities/Project';
import { ProjectNotFoundError } from '../../domain/errors/ProjectNotFoundError';
import type { IProjectRepository } from '../../domain/ports/IProjectRepository';
import { TagCategory } from '../../domain/value-objects/Tag';
import type { Tag } from '../../domain/value-objects/Tag';
import type { WikiLink } from '../../domain/value-objects/WikiLink';
import { FrontmatterParser } from './FrontmatterParser';

export class MarkdownProjectRepository implements IProjectRepository {
  constructor(
    private readonly dataDir: string,
    private readonly parser: FrontmatterParser,
  ) {}

  private projectDir(slug: string): string {
    return path.join(this.dataDir, 'projects', slug);
  }

  private projectFile(slug: string): string {
    return path.join(this.projectDir(slug), 'README.md');
  }

  private archiveDir(slug: string): string {
    return path.join(this.dataDir, 'archive', slug);
  }

  async findAll(): Promise<Project[]> {
    const projectsRoot = path.join(this.dataDir, 'projects');
    await fs.ensureDir(projectsRoot);
    const dirs = await fs.readdir(projectsRoot);
    const projects: Project[] = [];

    for (const dir of dirs) {
      const readmePath = path.join(projectsRoot, dir, 'README.md');
      if (!(await fs.pathExists(readmePath))) continue;
      try {
        const data = await this.parser.parseFile(readmePath);
        if (data.type === 'project') projects.push(this.toEntity(data));
      } catch {
        /* skip malformed */
      }
    }

    return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findAllArchived(): Promise<Project[]> {
    const archiveRoot = path.join(this.dataDir, 'archive');
    await fs.ensureDir(archiveRoot);
    const dirs = await fs.readdir(archiveRoot);
    const projects: Project[] = [];

    for (const dir of dirs) {
      const readmePath = path.join(archiveRoot, dir, 'README.md');
      if (!(await fs.pathExists(readmePath))) continue;
      try {
        const data = await this.parser.parseFile(readmePath);
        projects.push(this.toEntity(data));
      } catch {
        /* skip */
      }
    }

    return projects;
  }

  async findById(id: string): Promise<Project | null> {
    const all = await this.findAll();
    const archived = await this.findAllArchived();
    return [...all, ...archived].find(p => p.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const filePath = this.projectFile(slug);
    if (!(await fs.pathExists(filePath))) return null;
    const data = await this.parser.parseFile(filePath);
    return this.toEntity(data);
  }

  async save(project: Project, tags: Tag[], links: WikiLink[], aliases: string[]): Promise<void> {
    const dir = this.projectDir(project.slug);
    await fs.ensureDir(dir);
    await fs.ensureDir(path.join(dir, 'epics'));
    await fs.ensureDir(path.join(dir, 'tasks'));
    await fs.ensureDir(path.join(dir, 'notes'));

    const filePath = this.projectFile(project.slug);
    const frontmatter = this.parser.buildFrontmatter(
      {
        id: project.id,
        type: 'project',
        title: project.title,
        slug: project.slug,
        status: project.status,
        description: project.description,
        jira_board_id: project.jiraBoardId,
        jira_board_name: project.jiraBoardName,
        jira_project_key: project.jiraProjectKey,
        created_at: project.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      tags,
      aliases,
      'pm-project',
    );

    const existingBody = (await fs.pathExists(filePath))
      ? (await this.parser.parseFileWithBody(filePath)).content
      : `## Opis projektu\n\n${project.description}\n\n## Powiązane\n\n${links.map(l => `- ${l.toString()}`).join('\n')}\n`;

    await fs.writeFile(filePath, this.parser.serialize(frontmatter, existingBody), 'utf-8');
  }

  async archive(id: string): Promise<void> {
    const project = await this.findById(id);
    if (!project) throw new ProjectNotFoundError(id);

    const src = this.projectDir(project.slug);
    const dest = this.archiveDir(project.slug);
    await fs.move(src, dest, { overwrite: false });

    const archivedFile = path.join(dest, 'README.md');
    const data = await this.parser.parseFile(archivedFile);
    await this.parser.updateFrontmatterOnly(archivedFile, {
      ...data,
      status: 'archived',
      updated_at: new Date().toISOString(),
    });
  }

  async restore(id: string): Promise<void> {
    const archiveRoot = path.join(this.dataDir, 'archive');
    const dirs = await fs.readdir(archiveRoot);

    for (const dir of dirs) {
      const readmePath = path.join(archiveRoot, dir, 'README.md');
      if (!(await fs.pathExists(readmePath))) continue;
      const data = await this.parser.parseFile(readmePath);
      if (data.id === id) {
        const src = path.join(archiveRoot, dir);
        const dest = this.projectDir(dir);
        await fs.move(src, dest);
        await this.parser.updateFrontmatterOnly(path.join(dest, 'README.md'), {
          ...data,
          status: 'active',
          updated_at: new Date().toISOString(),
        });
        return;
      }
    }

    throw new ProjectNotFoundError(id);
  }

  private toEntity(data: Record<string, unknown>): Project {
    const jiraBoardRaw = data['jira_board_id'];
    const jiraBoardNum =
      typeof jiraBoardRaw === 'number'
        ? jiraBoardRaw
        : jiraBoardRaw != null && String(jiraBoardRaw).trim() !== ''
          ? Number(jiraBoardRaw)
          : NaN;
    const jiraBoardId = Number.isFinite(jiraBoardNum) ? jiraBoardNum : null;

    return new Project(
      data.id as string,
      data.title as string,
      data.slug as string,
      (data.status as 'active' | 'archived') ?? 'active',
      (data.description as string) ?? '',
      jiraBoardId,
      (data.jira_board_name as string | null) ?? null,
      (data.jira_project_key as string | null) ?? null,
      this.parser.parseTags(data).filter(t => t.category === TagCategory.CUSTOM),
      new Date(data.created_at as string),
      new Date(data.updated_at as string),
    );
  }
}
