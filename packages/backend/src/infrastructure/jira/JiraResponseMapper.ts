import type { JiraIssue } from '../../domain/ports/IJiraAdapter';

export class JiraResponseMapper {
  static toIssue(raw: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: { name: string };
      assignee?: { displayName: string } | null;
      priority?: { name: string } | null;
      issuetype: { name: string };
      description?: unknown;
      customfield_10014?: string | null;
      parent?: { key: string } | null;
    };
  }): JiraIssue {
    return {
      id: raw.id,
      key: raw.key,
      summary: raw.fields.summary,
      description: this.parseAdfToMarkdown(raw.fields.description),
      status: raw.fields.status.name,
      assignee: raw.fields.assignee?.displayName ?? null,
      priority: raw.fields.priority?.name ?? 'Medium',
      issueType: raw.fields.issuetype.name,
      epicKey: raw.fields.customfield_10014 ?? raw.fields.parent?.key ?? null,
    };
  }

  private static parseAdfToMarkdown(adf: any): string | null {
    if (!adf) return null;
    if (typeof adf === 'string') return adf;
    if (typeof adf !== 'object') return JSON.stringify(adf);

    if (adf.type === 'doc') {
      return (adf.content || [])
        .map((node: any) => this.parseNode(node))
        .filter(Boolean)
        .join('\n\n');
    }
    return JSON.stringify(adf);
  }

  private static parseNode(node: any): string {
    if (!node) return '';
    switch (node.type) {
      case 'paragraph':
        return (node.content || []).map((c: any) => this.parseNode(c)).join('');
      case 'text':
        let text = node.text || '';
        if (node.marks) {
          // Sort marks to ensure consistent nesting (e.g. bold outside italic)
          const sortedMarks = [...node.marks].sort((a, b) => {
            const order = ['strong', 'em', 'strike', 'code', 'link'];
            return order.indexOf(a.type) - order.indexOf(b.type);
          });
          
          for (const mark of sortedMarks) {
            if (mark.type === 'strong') text = `**${text}**`;
            else if (mark.type === 'em') text = `*${text}*`;
            else if (mark.type === 'strike') text = `~~${text}~~`;
            else if (mark.type === 'code') text = `\`${text}\``;
            else if (mark.type === 'link') text = `[${text}](${mark.attrs.href})`;
          }
        }
        return text;
      case 'heading':
        const level = node.attrs?.level || 1;
        const prefix = '#'.repeat(level) + ' ';
        return prefix + (node.content || []).map((c: any) => this.parseNode(c)).join('');
      case 'bulletList':
        return (node.content || []).map((c: any) => '* ' + this.parseNode(c)).join('\n');
      case 'orderedList':
        return (node.content || []).map((c: any, index: number) => `${index + 1}. ` + this.parseNode(c)).join('\n');
      case 'listItem':
        // List items usually contain paragraphs
        return (node.content || []).map((c: any) => this.parseNode(c)).join('\n').trim();
      case 'codeBlock':
        const lang = node.attrs?.language || '';
        const code = (node.content || []).map((c: any) => c.text).join('\n');
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      case 'blockquote':
        return '> ' + (node.content || []).map((c: any) => this.parseNode(c)).join('\n> ');
      case 'hardBreak':
        return '\n';
      case 'rule':
        return '---';
      default:
        // Handle nested content if unknown but has content
        if (node.content) {
          return (node.content || []).map((c: any) => this.parseNode(c)).join('');
        }
        return '';
    }
  }
}
