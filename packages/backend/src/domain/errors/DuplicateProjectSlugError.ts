export class DuplicateProjectSlugError extends Error {
  constructor(public readonly slug: string) {
    super(`Project with slug "${slug}" already exists`);
    this.name = 'DuplicateProjectSlugError';
  }
}
