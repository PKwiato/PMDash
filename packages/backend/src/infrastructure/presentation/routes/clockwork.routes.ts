import { Router } from 'express';
import { WorklogAnalysisService } from '../../../application/services/WorklogAnalysisService';
import { IJiraAdapter } from '../../../domain/ports/IJiraAdapter';

export function clockworkRouter(jiraAdapter: IJiraAdapter | null) {
  const router = Router();

  router.get('/analysis', async (req, res) => {
    if (!jiraAdapter) {
      return res.status(400).json({ error: 'Jira not configured' });
    }

    const { boardId, dateFrom, dateTo } = req.query;

    if (!boardId || !dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Missing required parameters: boardId, dateFrom, dateTo' });
    }

    try {
      const service = new WorklogAnalysisService(jiraAdapter);
      const analysis = await service.analyzeBoard(
        Number(boardId),
        String(dateFrom),
        String(dateTo)
      );
      res.json(analysis);
    } catch (error: any) {
      console.error('Clockwork analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze worklogs', details: error.message });
    }
  });

  return router;
}
