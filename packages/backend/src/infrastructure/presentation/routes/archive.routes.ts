import type { Project } from '../../../domain/entities/Project';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
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

export function archiveRouter(projectRepo: IProjectRepository) {
  const r = Router();
  r.get('/', async (_req, res, next) => {
    try {
      const list = await projectRepo.findAllArchived();
      res.json(list.map(projectToJson));
    } catch (e) {
      next(e);
    }
  });
  r.post('/:id/restore', async (req, res, next) => {
    try {
      await projectRepo.restore(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  return r;
}
