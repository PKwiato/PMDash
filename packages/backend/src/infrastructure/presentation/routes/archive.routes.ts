import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { projectToJson } from '../serialization/projectDto';
import { Router } from 'express';

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
