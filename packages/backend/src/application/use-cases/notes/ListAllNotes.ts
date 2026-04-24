import type { Note } from '../../../domain/entities/Note';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';

export class ListAllNotes {
  constructor(private readonly noteRepo: INoteRepository) {}

  async execute(): Promise<Note[]> {
    return this.noteRepo.findAll();
  }
}
