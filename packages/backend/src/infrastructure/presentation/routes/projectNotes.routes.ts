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
      const [notes, project] = await Promise.all([
        listNotes.execute(projectId),
        projectRepo.findById(projectId),
      ]);
      res.json(notes.map(n => noteToListJson(n, project?.slug)));
    } catch (e) {
      next(e);
    }
  });

  r.post('/', async (req, res, next) => {
    try {
      const { title, body, userTags } = req.body as {
        title?: string;
        body?: string;
        userTags?: unknown;
      };
      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'title is required' });
        return;
      }
      if (userTags !== undefined) {
        if (!Array.isArray(userTags) || userTags.some(t => typeof t !== 'string')) {
          res.status(400).json({ error: 'userTags must be an array of strings' });
          return;
        }
      }
      const projectId = (req.params as { projectId: string }).projectId;
      const note = await createNote.execute({
        projectId,
        title,
        body: typeof body === 'string' ? body : undefined,
        userTags: userTags as string[] | undefined,
      });
      const project = await projectRepo.findById(projectId);
      res.status(201).json({
        ...noteToListJson(note, project?.slug),
        body: typeof body === 'string' ? body : '',
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
