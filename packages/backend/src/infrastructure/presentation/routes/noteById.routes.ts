import { DeleteNote } from '../../../application/use-cases/notes/DeleteNote';
import { GetNote } from '../../../application/use-cases/notes/GetNote';
import { UpdateNote } from '../../../application/use-cases/notes/UpdateNote';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { noteToListJson } from '../serialization/noteDto';
import { Router } from 'express';

export function noteByIdRouter(projectRepo: IProjectRepository, noteRepo: INoteRepository) {
  const r = Router();
  const getNote = new GetNote(noteRepo);
  const updateNote = new UpdateNote(noteRepo, projectRepo);
  const deleteNote = new DeleteNote(noteRepo);

  r.get('/:id', async (req, res, next) => {
    try {
      const data = await getNote.execute(req.params.id);
      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  r.put('/:id', async (req, res, next) => {
    try {
      const { title, body } = req.body as { title?: string; body?: string };
      if (typeof body !== 'string') {
        res.status(400).json({ error: 'body is required' });
        return;
      }
      const note = await updateNote.execute({ id: req.params.id, title, body });
      res.json(noteToListJson(note));
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', async (req, res, next) => {
    try {
      await deleteNote.execute(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return r;
}
