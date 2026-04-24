export class EpicNotFoundError extends Error {
  constructor(id: string) {
    super(`Epic not found: ${id}`);
    this.name = 'EpicNotFoundError';
  }
}
