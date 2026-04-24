import type { Project } from '../../../domain/entities/Project';
import type { IEpicRepository } from '../../../domain/ports/IEpicRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import { Router } from 'express';

function projectToJson(p: Project) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    description: p.description,
    jiraBoardId: p.jiraBoardId,
    jiraBoardName: p.jiraBoardName,
    jiraProjectKey: p.jiraProjectKey,
    tags: p.userTags.map(t => t.slug),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function projectsRouter(
  projectRepo: IProjectRepository,
  _epicRepo: IEpicRepository,
  _taskRepo: ITaskRepository,
) {
  const r = Router();
  r.get('/', async (_req, res, next) => {
    try {
      const list = await projectRepo.findAll();
      res.json(list.map(projectToJson));
    } catch (e) {
      next(e);
    }
  });
  return r;
}
