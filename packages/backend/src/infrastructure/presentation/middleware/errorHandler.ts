import type { NextFunction, Request, Response } from 'express';
import { DuplicateProjectSlugError } from '../../../domain/errors/DuplicateProjectSlugError';
import { EpicNotFoundError } from '../../../domain/errors/EpicNotFoundError';
import { InvalidTagError } from '../../../domain/errors/InvalidTagError';
import { NoteNotFoundError } from '../../../domain/errors/NoteNotFoundError';
import { ProjectNotFoundError } from '../../../domain/errors/ProjectNotFoundError';
import { TaskNotFoundError } from '../../../domain/errors/TaskNotFoundError';
import { JiraApiError } from '../../jira/JiraApiClient';

const isProduction = process.env.NODE_ENV === 'production';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (
    err instanceof ProjectNotFoundError ||
    err instanceof EpicNotFoundError ||
    err instanceof TaskNotFoundError ||
    err instanceof NoteNotFoundError
  ) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof InvalidTagError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof DuplicateProjectSlugError) {
    res.status(409).json({ error: err.message });
    return;
  }
  if (err instanceof JiraApiError) {
    const responseStatus = [401, 403, 404].includes(err.status) ? err.status : 502;
    res.status(responseStatus).json({ error: err.message });
    return;
  }
  console.error('[ERROR]', err);
  if (isProduction) {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      stack: err.stack,
    });
  }
}
