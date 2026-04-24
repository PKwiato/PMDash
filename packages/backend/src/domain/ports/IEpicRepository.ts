import type { Epic } from '../entities/Epic';
import type { Tag } from '../value-objects/Tag';
import type { WikiLink } from '../value-objects/WikiLink';

export interface IEpicRepository {
  findByProjectId(projectId: string): Promise<Epic[]>;
  findById(id: string): Promise<Epic | null>;
  save(epic: Epic, tags: Tag[], links: WikiLink[], aliases: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}
