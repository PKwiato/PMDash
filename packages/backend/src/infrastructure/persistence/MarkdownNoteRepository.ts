import fg from 'fast-glob';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Note } from '../../domain/entities/Note';
import { NoteNotFoundError } from '../../domain/errors/NoteNotFoundError';
import type { INoteRepository } from '../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../domain/ports/IProjectRepository';
import { TagCategory } from '../../domain/value-objects/Tag';
import type { Tag } from '../../domain/value-objects/Tag';
import type { WikiLink } from '../../domain/value-objects/WikiLink';
import { FrontmatterParser } from './FrontmatterParser';

import type { AppConfig } from '../config/ConfigStore';

export class MarkdownNoteRepository implements INoteRepository {
  constructor(
    private readonly config: AppConfig,
    private readonly parser: FrontmatterParser,
    private readonly projectRepo: IProjectRepository,
  ) {}

  private get dataDir(): string {
    return this.config.vault.activeMode === 'production'
      ? this.config.vault.productionDir
      : this.config.vault.testDir;
  }

  private notesDir(projectSlug: string): string {
    return path.join(this.dataDir, 'projects', projectSlug, 'notes');
  }

  async findByProjectId(projectId: string): Promise<Note[]> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return [];

    const dir = this.notesDir(project.slug);
    if (!(await fs.pathExists(dir))) return [];

    const files = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));
    const notes: Note[] = [];

    for (const f of files) {
      try {
        const result = await this.parser.parseFileWithBody(path.join(dir, f));
        if (result.data.type === 'note') notes.push(this.toNote(result.data, result.content));
      } catch {
        /* skip */
      }
    }

    return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findAll(): Promise<Note[]> {
    const paths = await fg('projects/*/notes/*.md', {
      cwd: this.dataDir.replace(/\\/g, '/'),
      onlyFiles: true,
      absolute: true,
    });
    
    const notes: Note[] = [];
    for (const filePath of paths) {
      try {
        const result = await this.parser.parseFileWithBody(filePath);
        if (result.data.type === 'note') notes.push(this.toNote(result.data, result.content));
      } catch {
        /* skip */
      }
    }

    return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findById(id: string): Promise<Note | null> {
    const filePath = await this.findFilePathById(id);
    if (!filePath) return null;
    const data = await this.parser.parseFile(filePath);
    return this.toNote(data);
  }

  async readBody(id: string): Promise<string | null> {
    const filePath = await this.findFilePathById(id);
    if (!filePath) return null;
    const { content } = await this.parser.parseFileWithBody(filePath);
    return content;
  }

  async findFilePathById(id: string): Promise<string | null> {
    const paths = await fg('projects/*/notes/*.md', {
      cwd: this.dataDir.replace(/\\/g, '/'),
      onlyFiles: true,
      absolute: true,
    });
    for (const filePath of paths) {
      try {
        const data = await this.parser.parseFile(filePath);
        if (data.type === 'note' && data.id === id) return filePath;
      } catch {
        /* skip */
      }
    }
    return null;
  }

  async noteSlugExists(projectId: string, slug: string): Promise<boolean> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return true;
    return fs.pathExists(path.join(this.notesDir(project.slug), `${slug}.md`));
  }

  async save(
    note: Note,
    tags: Tag[],
    _links: WikiLink[],
    aliases: string[],
    body: string,
  ): Promise<void> {
    const project = await this.projectRepo.findById(note.projectId);
    if (!project) throw new Error(`Project not found for note: ${note.projectId}`);

    const dir = this.notesDir(project.slug);
    await fs.ensureDir(dir);

    const existingPath = await this.findFilePathById(note.id);
    const filePath = existingPath ?? path.join(dir, `${note.slug}.md`);

    const frontmatter = this.parser.buildFrontmatter(
      {
        id: note.id,
        type: 'note',
        title: note.title,
        slug: note.slug,
        project_id: note.projectId,
        created_at: note.createdAt.toISOString(),
        updated_at: note.updatedAt.toISOString(),
      },
      tags,
      aliases,
      'pm-note',
    );

    await fs.writeFile(filePath, this.parser.serialize(frontmatter, body || '\n'), 'utf-8');
  }

  async delete(id: string): Promise<void> {
    const filePath = await this.findFilePathById(id);
    if (!filePath) throw new NoteNotFoundError(id);
    await fs.unlink(filePath);
  }

  async getNoteAttachmentDir(id: string): Promise<string | null> {
    const note = await this.findById(id);
    if (!note) return null;
    const project = await this.projectRepo.findById(note.projectId);
    if (!project) return null;
    return path.join(this.notesDir(project.slug), 'attachments', note.slug);
  }

  private toNote(data: Record<string, unknown>, body?: string): Note {
    return new Note(
      data.id as string,
      data.title as string,
      data.slug as string,
      data.project_id as string,
      this.parser.parseTags(data).filter(t => t.category === TagCategory.CUSTOM),
      new Date(data.created_at as string),
      new Date(data.updated_at as string),
      body
    );
  }
}
