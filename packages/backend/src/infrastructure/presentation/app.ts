import type { AppConfig } from '../config/ConfigStore';
import { JiraApiAdapter } from '../jira/JiraApiAdapter';
import { JiraApiClient } from '../jira/JiraApiClient';
import { FrontmatterParser } from '../persistence/FrontmatterParser';
import { MarkdownEpicRepository } from '../persistence/MarkdownEpicRepository';
import { MarkdownNoteRepository } from '../persistence/MarkdownNoteRepository';
import { MarkdownProjectRepository } from '../persistence/MarkdownProjectRepository';
import { MarkdownTagRepository } from '../persistence/MarkdownTagRepository';
import { MarkdownTaskRepository } from '../persistence/MarkdownTaskRepository';
import { ObsidianVaultWriter } from '../persistence/ObsidianVaultWriter';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { archiveRouter } from './routes/archive.routes';
import { epicsRouter } from './routes/epics.routes';
import { jiraRouter } from './routes/jira.routes';
import { noteByIdRouter } from './routes/noteById.routes';
import { projectNotesRouter } from './routes/projectNotes.routes';
import { projectsRouter } from './routes/projects.routes';
import { tagsRouter } from './routes/tags.routes';
import { tasksRouter } from './routes/tasks.routes';
import { vaultRouter } from './routes/vault.routes';

export function createExpressApp(config: AppConfig, dataDir: string) {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  const parser = new FrontmatterParser();
  const projectRepo = new MarkdownProjectRepository(config, parser);
  const noteRepo = new MarkdownNoteRepository(config, parser, projectRepo);
  const epicRepo = new MarkdownEpicRepository();
  const taskRepo = new MarkdownTaskRepository();
  const tagRepo = new MarkdownTagRepository();
  const vaultWriter = new ObsidianVaultWriter(config);

  let jiraAdapter: JiraApiAdapter | null = null;
  if (config.jira.baseUrl && config.jira.token) {
    const jiraClient = new JiraApiClient(config.jira);
    jiraAdapter = new JiraApiAdapter(jiraClient);
  }

  app.use('/api/notes', noteByIdRouter(projectRepo, noteRepo));
  app.use('/api/projects', projectsRouter(projectRepo, epicRepo, taskRepo));
  app.use('/api/projects/:projectId/notes', projectNotesRouter(projectRepo, noteRepo));
  app.use(
    '/api/epics',
    epicsRouter(epicRepo, taskRepo, projectRepo, jiraAdapter, config.jira.defaultBoardId),
  );
  app.use('/api/tasks', tasksRouter(taskRepo, projectRepo, epicRepo, jiraAdapter));
  app.use('/api/tags', tagsRouter(tagRepo, vaultWriter));
  app.use('/api/jira', jiraRouter(jiraAdapter, taskRepo, projectRepo, epicRepo, config, dataDir));
  app.use('/api/vault', vaultRouter(vaultWriter, tagRepo, config, dataDir));
  app.use('/api/archive', archiveRouter(projectRepo));
  app.use(errorHandler);

  return app;
}
