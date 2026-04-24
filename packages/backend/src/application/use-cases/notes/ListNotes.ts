import { ProjectNotFoundError } from '../../../domain/errors/ProjectNotFoundError';
import type { Note } from '../../../domain/entities/Note';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';

export class ListNotes {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly noteRepo: INoteRepository,
  ) {}

  async execute(projectId: string): Promise<Note[]> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new ProjectNotFoundError(projectId);
    return this.noteRepo.findByProjectId(projectId);
  }
}
