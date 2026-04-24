import { CreateNote } from '../../../application/use-cases/notes/CreateNote';
import { ListNotes } from '../../../application/use-cases/notes/ListNotes';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { noteToListJson } from '../serialization/noteDto';
import { Router } from 'express';

export function projectNotesRouter(projectRepo: IProjectRepository, noteRepo: INoteRepository) {
  const r = Router({ mergeParams: true });
  const listNotes = new ListNotes(projectRepo, noteRepo);
  const createNote = new CreateNote(projectRepo, noteRepo);

  r.get('/', async (req, res, next) => {
    try {
      const projectId = (req.params as { projectId: string }).projectId;
      const notes = await listNotes.execute(projectId);
      res.json(notes.map(noteToListJson));
    } catch (e) {
      next(e);
    }
  });

  r.post('/', async (req, res, next) => {
    try {
      const { title, body } = req.body as { title?: string; body?: string };
      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'title is required' });
        return;
      }
      const projectId = (req.params as { projectId: string }).projectId;
      const note = await createNote.execute({
        projectId,
        title,
        body: typeof body === 'string' ? body : undefined,
      });
      res.status(201).json({ ...noteToListJson(note), body: typeof body === 'string' ? body : '' });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
