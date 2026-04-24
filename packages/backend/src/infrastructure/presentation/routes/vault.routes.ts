import type { ITagRepository } from '../../../domain/ports/ITagRepository';
import type { ObsidianVaultWriter } from '../../persistence/ObsidianVaultWriter';
import { Router } from 'express';

export function vaultRouter(vaultWriter: ObsidianVaultWriter, _tagRepo: ITagRepository) {
  const r = Router();
  r.post('/init', async (_req, res, next) => {
    try {
      await vaultWriter.initVault();
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  r.post('/rebuild', async (_req, res, next) => {
    try {
      await vaultWriter.rebuildTagIndex([]);
      await vaultWriter.rebuildBoardIndex();
      await vaultWriter.rebuildAllTasksIndex();
      await vaultWriter.rebuildJiraUnlinkedIndex();
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  return r;
}
