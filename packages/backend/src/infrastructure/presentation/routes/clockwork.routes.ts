import { Router } from 'express';
import { WorklogAnalysisService } from '../../../application/services/WorklogAnalysisService';
import type { IJiraAdapter } from '../../../domain/ports/IJiraAdapter';
import { ConfigStore } from '../../config/ConfigStore';
import { createClockworkAdapter } from '../../clockwork/createClockworkAdapter';

export function clockworkRouter(
  jiraAdapter: IJiraAdapter | null,
  dataDir: string,
) {
  const router = Router();

  router.get('/analysis', async (req, res) => {
    if (!jiraAdapter) {
      return res.status(503).json({ error: 'Jira not configured' });
    }

    const config = await ConfigStore.load(dataDir);
    const clockworkAdapter = createClockworkAdapter(config);
    if (!clockworkAdapter) {
      return res.status(503).json({ error: 'Clockwork not configured' });
    }

    const { boardId, dateFrom, dateTo } = req.query;

    if (!boardId || !dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Missing required parameters: boardId, dateFrom, dateTo' });
    }

    try {
      const service = new WorklogAnalysisService(jiraAdapter, clockworkAdapter);
      const analysis = await service.analyzeBoard(
        Number(boardId),
        String(dateFrom),
        String(dateTo)
      );
      res.json(analysis);
    } catch (error: unknown) {
      console.error('Clockwork analysis error:', error);
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Failed to analyze worklogs', details: message });
    }
  });

  return router;
}
