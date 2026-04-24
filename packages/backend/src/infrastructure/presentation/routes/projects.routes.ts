import { CreateProject } from '../../../application/use-cases/projects/CreateProject';
import { ProjectNotFoundError } from '../../../domain/errors/ProjectNotFoundError';
import type { IEpicRepository } from '../../../domain/ports/IEpicRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import { projectToJson } from '../serialization/projectDto';
import { Router } from 'express';

export function projectsRouter(
  projectRepo: IProjectRepository,
  _epicRepo: IEpicRepository,
  _taskRepo: ITaskRepository,
) {
  const r = Router();
  const createProject = new CreateProject(projectRepo);

  r.get('/', async (_req, res, next) => {
    try {
      const list = await projectRepo.findAll();
      res.json(list.map(projectToJson));
    } catch (e) {
      next(e);
    }
  });

  r.post('/', async (req, res, next) => {
    try {
      const body = req.body as { title?: string; description?: string; tags?: string[] };
      if (!body?.title || typeof body.title !== 'string') {
        res.status(400).json({ error: 'title is required' });
        return;
      }
      const project = await createProject.execute({
        title: body.title,
        description: body.description,
        tags: body.tags,
      });
      res.status(201).json(projectToJson(project));
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id', async (req, res, next) => {
    try {
      const p = await projectRepo.findById(req.params.id);
      if (!p) throw new ProjectNotFoundError(req.params.id);
      res.json(projectToJson(p));
    } catch (e) {
      next(e);
    }
  });

  return r;
}
