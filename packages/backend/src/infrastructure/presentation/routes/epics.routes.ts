import { GetEpicProgress } from '../../../application/use-cases/epics/GetEpicProgress';
import type { IEpicRepository } from '../../../domain/ports/IEpicRepository';
import type { IJiraAdapter } from '../../../domain/ports/IJiraAdapter';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import { Router } from 'express';

export function epicsRouter(
  epicRepo: IEpicRepository,
  taskRepo: ITaskRepository,
  projectRepo: IProjectRepository,
  jiraAdapter: IJiraAdapter | null,
  defaultBoardId: number,
) {
  const r = Router();
  const getEpicProgress = new GetEpicProgress(
    epicRepo,
    taskRepo,
    projectRepo,
    jiraAdapter,
    defaultBoardId,
  );

  r.get('/:id/progress', async (req, res, next) => {
    try {
      const p = await getEpicProgress.execute(req.params.id);
      res.json({
        epicId: req.params.id,
        total: p.total,
        done: p.done,
        inProgress: p.inProgress,
        blocked: p.blocked,
        todo: p.todo,
        percentageComplete: p.percentage,
        jiraLinkedCount: p.jiraLinkedCount,
        jiraProgressSummary: p.jiraProgressSummary,
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
