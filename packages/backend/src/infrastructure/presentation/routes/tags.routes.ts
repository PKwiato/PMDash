import { Router } from 'express';
import type { ITagRepository } from '../../../domain/ports/ITagRepository';
import type { ObsidianVaultWriter } from '../../persistence/ObsidianVaultWriter';
import { Tag, TagCategory } from '../../../domain/value-objects/Tag';
import { InvalidTagError } from '../../../domain/errors/InvalidTagError';

export function tagsRouter(tagRepo: ITagRepository, _vaultWriter: ObsidianVaultWriter) {
  const r = Router();

  r.get('/', async (_req, res, next) => {
    try {
      const tags = await tagRepo.findAll();
      res.json(
        tags.map(t => ({
          slug: t.tag.slug,
          label: t.tag.label,
          category: t.tag.category,
          count: t.count,
          editable: t.tag.category === TagCategory.CUSTOM,
        })),
      );
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:slug(*)', async (req, res, next) => {
    try {
      const oldSlug = decodeURIComponent(req.params.slug);
      const { slug: newSlugRaw } = req.body as { slug?: unknown };
      if (typeof newSlugRaw !== 'string') {
        res.status(400).json({ error: 'slug (new value) is required as string' });
        return;
      }
      if (!Tag.isValid(oldSlug)) throw new InvalidTagError(oldSlug);
      if (!Tag.isValid(newSlugRaw)) throw new InvalidTagError(newSlugRaw);
      const result = await tagRepo.renameInNotes(oldSlug, newSlugRaw);
      res.json({ oldSlug, newSlug: newSlugRaw, ...result });
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:slug(*)', async (req, res, next) => {
    try {
      const slug = decodeURIComponent(req.params.slug);
      if (!Tag.isValid(slug)) throw new InvalidTagError(slug);
      const result = await tagRepo.deleteFromNotes(slug);
      res.json({ slug, ...result });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
