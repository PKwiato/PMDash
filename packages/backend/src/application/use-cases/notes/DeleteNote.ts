import { NoteNotFoundError } from '../../../domain/errors/NoteNotFoundError';
import type { INoteRepository } from '../../../domain/ports/INoteRepository';

export class DeleteNote {
  constructor(private readonly noteRepo: INoteRepository) {}

  async execute(id: string): Promise<void> {
    const note = await this.noteRepo.findById(id);
    if (!note) throw new NoteNotFoundError(id);
    await this.noteRepo.delete(id);
  }
}
