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
    const fields = raw.fields as any;
    
    const linkedIssues = (fields.issuelinks || []).map((link: any) => {
      const issue = link.outwardIssue || link.inwardIssue;
      if (!issue) return null;
      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name ?? 'Medium',
        issueType: issue.fields.issuetype.name,
      };
    }).filter(Boolean);

    const subtasks = (fields.subtasks || []).map((st: any) => ({
      id: st.id,
      key: st.key,
      summary: st.fields.summary,
      status: st.fields.status.name,
      priority: st.fields.priority?.name ?? 'Medium',
      issueType: st.fields.issuetype.name,
    }));

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
      comments: fields.comment?.comments?.map((c: any) => ({
        id: c.id,
        author: c.author?.displayName ?? 'Unknown',
        body: this.parseAdfToMarkdown(c.body) ?? '',
        created: c.created,
      })),
      linkedIssues,
      subtasks,
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
      case 'taskList':
        return (node.content || []).map((c: any) => this.parseNode(c)).join('\n');
      case 'taskItem':
        const checkState = node.attrs?.state === 'DONE' ? 'x' : ' ';
        const itemContent = (node.content || []).map((c: any) => this.parseNode(c)).join('').trim();
        return `- [${checkState}] ${itemContent}`;
      case 'codeBlock':
        const lang = node.attrs?.language || '';
        const code = (node.content || []).map((c: any) => c.text).join('\n');
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      case 'blockquote':
        return '> ' + (node.content || []).map((c: any) => this.parseNode(c)).join('\n> ');
      case 'hardBreak':
        return '\n';
      case 'rule':
        return '---\n';
      case 'inlineCard':
      case 'blockCard':
        return node.attrs?.url || '';
      case 'mention':
        return node.attrs?.text || '';
      default:
        // Handle nested content if unknown but has content
        if (node.content) {
          return (node.content || []).map((c: any) => this.parseNode(c)).join('');
        }
        return '';
    }
  }
}
