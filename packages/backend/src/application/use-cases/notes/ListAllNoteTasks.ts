import type { INoteRepository } from '../../../domain/ports/INoteRepository';

export interface NoteTaskDTO {
  noteId: string;
  noteTitle: string;
  text: string;
  completed: boolean;
  line: number;
}

export class ListAllNoteTasks {
  constructor(private readonly noteRepo: INoteRepository) { }

  async execute(): Promise<NoteTaskDTO[]> {
    const notes = await this.noteRepo.findAll();
    const allTasks: NoteTaskDTO[] = [];

    for (const note of notes) {
      const body = await this.noteRepo.readBody(note.id);
      if (!body) continue;

      const lines = body.split('\n');
      lines.forEach((lineText, index) => {
        const match = lineText.match(/^\s*[-*+]\s+\[( |x|X)\]\s+(.*)/);
        if (match) {
          allTasks.push({
            noteId: note.id,
            noteTitle: note.title,
            text: match[2].trim(),
            completed: match[1].toLowerCase() === 'x',
            line: index + 1
          });
        }
      });
    }

    return allTasks;
  }
}
