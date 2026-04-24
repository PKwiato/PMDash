export class InvalidTagError extends Error {
  constructor(slug: string) {
    super(`Invalid tag: ${slug}`);
    this.name = 'InvalidTagError';
  }
}
