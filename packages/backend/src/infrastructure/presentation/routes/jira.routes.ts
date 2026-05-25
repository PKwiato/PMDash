import type { IEpicRepository } from '../../../domain/ports/IEpicRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { JiraApiAdapter } from '../../jira/JiraApiAdapter';
import { ConfigStore, type AppConfig } from '../../config/ConfigStore';
import { Router } from 'express';

export function jiraRouter(
  jiraAdapter: JiraApiAdapter | null,
  _taskRepo: ITaskRepository,
  _projectRepo: IProjectRepository,
  _epicRepo: IEpicRepository,
  config: AppConfig,
  dataDir: string
) {
  const r = Router();

  r.get('/config', async (_req, res) => {
    res.json({ 
      defaultBoardId: config.jira.defaultBoardId,
      activeMode: config.vault.activeMode
    });
  });

  r.patch('/config', async (req, res, next) => {
    try {
      const { defaultBoardId } = req.body as { defaultBoardId: number };
      if (typeof defaultBoardId !== 'number') {
        res.status(400).json({ error: 'defaultBoardId must be a number' });
        return;
      }
      config.jira.defaultBoardId = defaultBoardId;
      await ConfigStore.save(dataDir, config);
      res.json({ defaultBoardId: config.jira.defaultBoardId });
    } catch (e) {
      next(e);
    }
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

  r.get('/boards/:boardId/sprint-scope', async (req, res, next) => {
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
      const sprints = await jiraAdapter.listBoardSprints(boardId);
      const activeSprint = sprints.find(s => s.state === 'active');
      if (activeSprint) {
        res.json({
          mode: 'active_sprint' as const,
          sprint: {
            id: activeSprint.id,
            name: activeSprint.name,
            state: activeSprint.state,
            startDate: activeSprint.startDate || null,
            endDate: activeSprint.endDate || null,
          },
        });
        return;
      }
      res.json({ mode: 'whole_board' as const, sprint: null });
    } catch (e) {
      next(e);
    }
  });

  r.get('/boards/:boardId/programs-overview', async (req, res, next) => {
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
      const issues = await jiraAdapter.listProgramsOverview(boardId);
      res.json(issues);
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
      const includeChangelog = req.query.includeChangelog === 'true';
      const changelogOpts = { includeChangelog };
      if (activeSprintOnly) {
        const sprints = await jiraAdapter.listBoardSprints(boardId);
        const activeSprint = sprints.find(s => s.state === 'active');
        if (activeSprint) {
          const issues = await jiraAdapter.listBoardIssues(boardId, activeSprint.id, changelogOpts);
          res.json(issues);
          return;
        }
      }

      const issues = await jiraAdapter.listBoardIssues(boardId, undefined, changelogOpts);
      res.json(issues);
    } catch (e) {
      next(e);
    }
  });

  r.get('/issues/:issueKey', async (req, res, next) => {
    try {
      if (!jiraAdapter) {
        res.status(503).json({ error: 'Jira not configured' });
        return;
      }
      const { issueKey } = req.params as { issueKey: string };
      if (!issueKey?.trim()) {
        res.status(400).json({ error: 'Invalid issue key' });
        return;
      }
      const includeChangelog = req.query.includeChangelog === 'true';
      const issue = await jiraAdapter.getIssue(issueKey, { includeChangelog });
      res.json(issue);
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
      const { keys, includeChangelog } = req.body as { keys: string[]; includeChangelog?: boolean };
      if (!Array.isArray(keys) || keys.length === 0) {
        res.json([]);
        return;
      }
      const issues = await jiraAdapter.listIssuesByKeys(keys, {
        includeChangelog: includeChangelog === true,
      });
      res.json(issues);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
