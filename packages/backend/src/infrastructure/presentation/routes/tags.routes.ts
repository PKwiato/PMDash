import type { ITagRepository } from '../../../domain/ports/ITagRepository';
import type { ObsidianVaultWriter } from '../../persistence/ObsidianVaultWriter';
import { Router } from 'express';

export function tagsRouter(_tagRepo: ITagRepository, _vaultWriter: ObsidianVaultWriter) {
  const r = Router();
  r.get('/', async (_req, res) => {
    res.json([]);
  });
  return r;
}
