import type { Task } from '../entities/Task';
import type { Tag } from '../value-objects/Tag';
import type { WikiLink } from '../value-objects/WikiLink';

export interface ITaskRepository {
  findByProjectId(projectId: string): Promise<Task[]>;
  findByEpicId(epicId: string): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  findAllLinkedToJira(): Promise<Task[]>;
  save(task: Task, tags: Tag[], links: WikiLink[], aliases: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}
