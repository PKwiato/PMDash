import { Router } from 'express';
import { PullRequestStatsService } from '../../../application/services/PullRequestStatsService';
import { ConfigStore } from '../../config/ConfigStore';
import { createGithubAdapter } from '../../github/createGithubAdapter';

export function githubRouter(dataDir: string) {
  const router = Router();

  router.get('/pr-stats', async (req, res, next) => {
    const config = await ConfigStore.load(dataDir);
    const githubAdapter = createGithubAdapter(config);
    if (!githubAdapter) {
      return res.status(503).json({ error: 'GitHub not configured' });
    }

    const owner = String(req.query.owner ?? config.github.defaultOwner);
    const repo = String(req.query.repo ?? config.github.defaultRepo);
    const dateFrom = req.query.dateFrom ? String(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? String(req.query.dateTo) : null;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Missing required parameters: dateFrom, dateTo' });
    }

    try {
      const service = new PullRequestStatsService(
        (o, r, since) => githubAdapter.listPullRequests(o, r, since),
      );
      const stats = await service.getStats(owner, repo, dateFrom, dateTo);
      res.json(stats);
    } catch (error: unknown) {
      next(error);
    }
  });

  return router;
}
