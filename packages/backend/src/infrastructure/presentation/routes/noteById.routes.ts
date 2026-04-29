import { ListAllNoteTasks } from '../../../application/use-cases/notes/ListAllNoteTasks';
import { DeleteNote } from '../../../application/use-cases/notes/DeleteNote';
import { GetNote } from '../../../application/use-cases/notes/GetNote';
import { ListAllNotes } from '../../../application/use-cases/notes/ListAllNotes';
import { UpdateNote } from '../../../application/use-cases/notes/UpdateNote';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import { noteToListJson } from '../serialization/noteDto';
import { Router } from 'express';
import multer from 'multer';
import * as fs from 'fs-extra';
import * as path from 'path';

export function noteByIdRouter(projectRepo: IProjectRepository, noteRepo: INoteRepository) {
  const r = Router();
  const listAllNotes = new ListAllNotes(noteRepo);
  const listAllNoteTasks = new ListAllNoteTasks(noteRepo);
  const getNote = new GetNote(noteRepo);
  const updateNote = new UpdateNote(noteRepo, projectRepo);
  const deleteNote = new DeleteNote(noteRepo);

  r.get('/tasks', async (_req, res, next) => {
    try {
      const tasks = await listAllNoteTasks.execute();
      res.json(tasks);
    } catch (e) {
      next(e);
    }
  });

  r.get('/', async (_req, res, next) => {
    try {
      const notes = await listAllNotes.execute();
      res.json(notes.map(noteToListJson));
    } catch (e) {
      next(e);
    }
  });

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
      res.json({ ...noteToListJson(note), body: typeof body === 'string' ? body : '' });
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

  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const id = req.params.id;
        const dir = await noteRepo.getNoteAttachmentDir(id);
        if (!dir) {
          cb(new Error('Note not found'), '');
          return;
        }
        await fs.ensureDir(dir);
        cb(null, dir);
      } catch (err) {
        cb(err as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
      cb(null, `${basename}-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({ storage });

  r.post('/:id/attachments', upload.single('file'), (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const filename = req.file.filename;
      const url = `/api/notes/${req.params.id}/attachments/${encodeURIComponent(filename)}`;
      res.status(201).json({ url });
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id/attachments/:filename', async (req, res, next) => {
    try {
      const id = req.params.id;
      const filename = req.params.filename;
      const dir = await noteRepo.getNoteAttachmentDir(id);
      if (!dir) {
        res.status(404).send();
        return;
      }
      const filePath = path.join(dir, filename);
      if (!(await fs.pathExists(filePath))) {
        res.status(404).send();
        return;
      }
      res.sendFile(filePath);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
