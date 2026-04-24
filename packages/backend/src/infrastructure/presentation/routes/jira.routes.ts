import type { IEpicRepository } from '../../../domain/ports/IEpicRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { JiraApiAdapter } from '../../jira/JiraApiAdapter';
import { Router } from 'express';

export function jiraRouter(
  jiraAdapter: JiraApiAdapter | null,
  _taskRepo: ITaskRepository,
  _projectRepo: IProjectRepository,
  _epicRepo: IEpicRepository,
  defaultBoardId?: number
) {
  const r = Router();

  r.get('/config', async (_req, res) => {
    res.json({ defaultBoardId });
  });

  r.get('/boards', async (_req, res, next) => {
    try {
      if (!jiraAdapter) {
        res.status(503).json({ error: 'Jira not configured' });
        return;
      }
      const boards = await jiraAdapter.listBoards();
      res.json(boards);
    } catch (e) {
      next(e);
    }
  });

  r.get('/boards/:boardId/projects', async (req, res, next) => {
    try {
      if (!jiraAdapter) {
        res.status(503).json({ error: 'Jira not configured' });
        return;
      }
      const boardId = Number((req.params as { boardId: string }).boardId);
      if (!Number.isFinite(boardId) || boardId < 1) {
        res.status(400).json({ error: 'Invalid boardId' });
        return;
      }
      const projects = await jiraAdapter.listBoardProjects(boardId);
      res.json(projects);
    } catch (e) {
      next(e);
    }
  });

  r.get('/boards/:boardId/issues', async (req, res, next) => {
    try {
      if (!jiraAdapter) {
        res.status(503).json({ error: 'Jira not configured' });
        return;
      }
      const boardId = Number((req.params as { boardId: string }).boardId);
      if (!Number.isFinite(boardId) || boardId < 1) {
        res.status(400).json({ error: 'Invalid boardId' });
        return;
      }
      const activeSprintOnly = req.query.activeSprintOnly === 'true';
      if (activeSprintOnly) {
        const sprints = await jiraAdapter.listBoardSprints(boardId);
        const activeSprint = sprints.find(s => s.state === 'active');
        if (activeSprint) {
          const issues = await jiraAdapter.listBoardIssues(boardId, activeSprint.id);
          res.json(issues);
          return;
        }
      }

      const issues = await jiraAdapter.listBoardIssues(boardId);
      res.json(issues);
    } catch (e) {
      next(e);
    }
  });

  r.post('/issues/bulk', async (req, res, next) => {
    try {
      if (!jiraAdapter) {
        res.status(503).json({ error: 'Jira not configured' });
        return;
      }
      const { keys } = req.body as { keys: string[] };
      if (!Array.isArray(keys) || keys.length === 0) {
        res.json([]);
        return;
      }
      const issues = await jiraAdapter.listIssuesByKeys(keys);
      res.json(issues);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
