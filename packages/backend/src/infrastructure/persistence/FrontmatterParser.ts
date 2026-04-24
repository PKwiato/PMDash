import matter from 'gray-matter';
import * as yaml from 'js-yaml';
import * as fs from 'fs-extra';
import { Tag } from '../../domain/value-objects/Tag';
import { TagCategory } from '../../domain/value-objects/Tag';

export class FrontmatterParser {
  async parseFile(filePath: string): Promise<Record<string, unknown>> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(raw);
    return data as Record<string, unknown>;
  }

  async parseFileWithBody(
    filePath: string,
  ): Promise<{ data: Record<string, unknown>; content: string }> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return { data: data as Record<string, unknown>, content };
  }

  async updateFrontmatterOnly(
    filePath: string,
    newFrontmatter: Record<string, unknown>,
  ): Promise<void> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { content } = matter(raw);
    const newYaml = yaml.dump(newFrontmatter, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    });
    const updated = `---\n${newYaml}\n---\n${content}`;
    await fs.writeFile(filePath, updated, 'utf-8');
  }

  serialize(frontmatter: Record<string, unknown>, body: string): string {
    const yamlStr = yaml.dump(frontmatter, { lineWidth: -1, quotingType: '"' });
    return `---\n${yamlStr}\n---\n\n${body.trim()}\n`;
  }

  parseTags(data: Record<string, unknown>): Tag[] {
    const raw = data['tags'];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t): t is string => typeof t === 'string')
      .filter(t => Tag.isValid(t))
      .map(t => Tag.of(t));
  }

  parseAliases(data: Record<string, unknown>): string[] {
    const raw = data['aliases'];
    if (!Array.isArray(raw)) return [];
    return raw.filter((a): a is string => typeof a === 'string');
  }

  buildFrontmatter(
    entity: Record<string, unknown>,
    tags: Tag[],
    aliases: string[],
    cssClass: string,
  ): Record<string, unknown> {
    return {
      ...entity,
      tags: tags.map(t => t.slug),
      aliases,
      cssclasses: [cssClass],
    };
  }
}
