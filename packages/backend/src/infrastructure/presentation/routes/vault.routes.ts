import { Router } from 'express';
import type { ObsidianVaultWriter } from '../../persistence/ObsidianVaultWriter';
import type { ITagRepository } from '../../../domain/ports/ITagRepository';
import { ConfigStore, type AppConfig } from '../../config/ConfigStore';

export function vaultRouter(
  vaultWriter: ObsidianVaultWriter,
  _tagRepo: ITagRepository,
  config: AppConfig,
  dataDir: string,
) {
  const r = Router();

  r.get('/settings', (_req, res) => {
    res.json(config.vault);
  });

  r.patch('/settings', async (req, res, next) => {
    try {
      const { productionDir, testDir, activeMode } = req.body;
      if (productionDir !== undefined) config.vault.productionDir = productionDir;
      if (testDir !== undefined) config.vault.testDir = testDir;
      if (activeMode !== undefined) config.vault.activeMode = activeMode;

      await ConfigStore.save(dataDir, config);
      res.json(config.vault);
    } catch (e) {
      next(e);
    }
  });

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
