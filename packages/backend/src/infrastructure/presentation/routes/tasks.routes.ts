import type { IEpicRepository } from '../../../domain/ports/IEpicRepository';
import type { IJiraAdapter } from '../../../domain/ports/IJiraAdapter';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import { Router } from 'express';

export function tasksRouter(
  _taskRepo: ITaskRepository,
  _projectRepo: IProjectRepository,
  _epicRepo: IEpicRepository,
  _jiraAdapter: IJiraAdapter | null,
) {
  const r = Router();
  return r;
}
