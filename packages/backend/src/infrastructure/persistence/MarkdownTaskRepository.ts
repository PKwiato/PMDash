import type { Task } from '../../domain/entities/Task';
import type { ITaskRepository } from '../../domain/ports/ITaskRepository';
import type { Tag } from '../../domain/value-objects/Tag';
import type { WikiLink } from '../../domain/value-objects/WikiLink';

/** Placeholder — implementacja zgodna z `.cursor/PM_SYSTEM_SPEC.md` w kolejnych iteracjach */
export class MarkdownTaskRepository implements ITaskRepository {
  async findByProjectId(_projectId: string): Promise<Task[]> {
    return [];
  }

  async findByEpicId(_epicId: string): Promise<Task[]> {
    return [];
  }

  async findById(_id: string): Promise<Task | null> {
    return null;
  }

  async findAllLinkedToJira(): Promise<Task[]> {
    return [];
  }

  async save(_task: Task, _tags: Tag[], _links: WikiLink[], _aliases: string[]): Promise<void> {
    return;
  }

  async delete(_id: string): Promise<void> {
    return;
  }
}
