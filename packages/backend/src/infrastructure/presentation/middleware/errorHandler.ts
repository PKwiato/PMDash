import type { NextFunction, Request, Response } from 'express';
import { JiraApiError } from '../../jira/JiraApiClient';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (
    err.name === 'ProjectNotFoundError' ||
    err.name === 'EpicNotFoundError' ||
    err.name === 'TaskNotFoundError' ||
    err.name === 'NoteNotFoundError'
  ) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err.name === 'InvalidTagError') {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.name === 'DuplicateProjectSlugError') {
    res.status(409).json({ error: err.message });
    return;
  }
  if (err instanceof JiraApiError || err.name === 'JiraApiError') {
    const jiraStatus = (err as any).status;
    // Map certain statuses directly, others to 502
    const responseStatus = [401, 403, 404].includes(jiraStatus) ? jiraStatus : 502;
    res.status(responseStatus).json({ error: err.message });
    return;
  }
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
}
