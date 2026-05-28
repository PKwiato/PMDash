import type { JiraChangelogHistory, JiraIssue, JiraLinkedIssue } from '../../domain/ports/IJiraAdapter';
import {
  businessDaysInCurrentStatusFromChangelog,
  returnsCountFromChangelog,
  statusDwellBusinessDaysFromChangelog,
} from '../../domain/jira/statusDwellFromChangelog';

export class JiraResponseMapper {
  private static statscoreTeamFieldId: string | null = null;

  static setStatscoreTeamFieldId(fieldId: string | null): void {
    this.statscoreTeamFieldId = fieldId;
  }

  static getStatscoreTeamFieldId(): string | null {
    return this.statscoreTeamFieldId;
  }

  static toIssue(raw: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: { name: string };
      assignee?: { displayName: string; avatarUrls?: Record<string, string> } | null;
      priority?: { name: string } | null;
      issuetype: { name: string };
      description?: unknown;
      customfield_10014?: string | { key?: string } | null;
      customfield_10013?: string | { value?: string } | null;
      parent?: {
        id: string;
        key: string;
        fields?: {
          summary?: string;
          status?: { name: string };
          priority?: { name: string };
          issuetype?: { name: string };
          customfield_10013?: string | null;
        };
      } | null;
      created?: string;
    };
    changelog?: { histories?: unknown[] };
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

    const issue: JiraIssue = {
      id: raw.id,
      key: raw.key,
      summary: raw.fields.summary,
      description: this.parseAdfToMarkdown(raw.fields.description),
      status: raw.fields.status.name,
      assignee: raw.fields.assignee?.displayName ?? null,
      assigneeAvatarUrl: raw.fields.assignee?.avatarUrls?.['48x48'] ?? null,
      priority: raw.fields.priority?.name ?? 'Medium',
      issueType: raw.fields.issuetype.name,
      epicKey: this.extractEpicKey(fields),
      epicColor: this.extractEpicColor(fields),
      parent: this.mapLinkedIssueRef(raw.fields.parent),
      comments: fields.comment?.comments?.map((c: any) => ({
        id: c.id,
        author: c.author?.displayName ?? 'Unknown',
        authorAvatarUrl: c.author?.avatarUrls?.['48x48'] ?? null,
        body: this.parseAdfToMarkdown(c.body) ?? '',
        created: c.created,
      })),
      linkedIssues,
      subtasks,
      storyPoints: fields.customfield_10004 ?? null,
      originalStoryPoints: fields.customfield_14054 ?? null,
      statscoreTeam: this.extractStatscoreTeam(fields),
    };

    const created = typeof fields.created === 'string' ? fields.created : undefined;
    if (created) {
      issue.created = created;
    }

    const rawAny = raw as Record<string, unknown>;
    if (rawAny.changelog != null && typeof rawAny.changelog === 'object') {
      const cl = rawAny.changelog as { histories?: unknown[] };
      const histories = Array.isArray(cl.histories) ? this.mapChangelogHistories(cl.histories) : [];
      issue.changelog = histories;
      if (created) {
        issue.statusDwellBusinessDays = statusDwellBusinessDaysFromChangelog(created, issue.status, histories);
        issue.currentStatusBusinessDays = businessDaysInCurrentStatusFromChangelog(created, histories);
        issue.returnsCount = returnsCountFromChangelog(histories);
      }
    }

    return issue;
  }

  private static extractEpicKey(fields: Record<string, unknown>): string | null {
    const v = fields.customfield_10014;
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object') {
      const o = v as { key?: string };
      if (typeof o.key === 'string' && o.key.trim()) return o.key.trim();
    }
    return null;
  }

  private static extractEpicColor(fields: Record<string, unknown>): string | null {
    return this.parseColorField(fields.customfield_10013);
  }

  private static extractStatscoreTeam(fields: Record<string, unknown>): string | null {
    const fieldId = this.statscoreTeamFieldId;
    if (!fieldId) return null;
    return this.parseTeamFieldValue(fields[fieldId]);
  }

  private static parseTeamFieldValue(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const parts = value
        .map(v => this.parseTeamFieldValue(v))
        .filter((v): v is string => Boolean(v));
      return parts.length > 0 ? parts.join(', ') : null;
    }
    if (typeof value === 'object') {
      const o = value as Record<string, unknown>;
      if (typeof o.value === 'string' && o.value.trim()) return o.value.trim();
      if (typeof o.name === 'string' && o.name.trim()) return o.name.trim();
    }
    return null;
  }

  private static parseColorField(value: unknown): string | null {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value === 'object') {
      const o = value as Record<string, unknown>;
      if (typeof o.value === 'string' && o.value.trim()) return o.value.trim();
      if (typeof o.key === 'string' && o.key.trim().startsWith('ghx-label')) return o.key.trim();
    }
    return null;
  }

  private static mapLinkedIssueRef(
    ref: {
      id: string;
      key: string;
      fields?: {
        summary?: string;
        status?: { name: string };
        priority?: { name: string };
        issuetype?: { name: string };
        customfield_10013?: string | null;
      };
    } | null | undefined,
  ): JiraLinkedIssue | null {
    if (!ref?.key) return null;
    const f = ref.fields;
    return {
      id: ref.id,
      key: ref.key,
      summary: f?.summary ?? ref.key,
      status: f?.status?.name ?? 'Unknown',
      priority: f?.priority?.name ?? 'Medium',
      issueType: f?.issuetype?.name ?? 'Unknown',
      color: f ? this.parseColorField(f.customfield_10013) : null,
    };
  }

  private static mapChangelogHistories(rawHistories: unknown[]): JiraChangelogHistory[] {
    return rawHistories.map((h): JiraChangelogHistory => {
      const row = h as Record<string, unknown>;
      const author = row.author as { displayName?: string } | undefined;
      const items = (Array.isArray(row.items) ? row.items : []) as Record<string, unknown>[];
      return {
        id: String(row.id ?? ''),
        created: String(row.created ?? ''),
        author: author?.displayName ?? null,
        items: items.map(it => ({
          field: String(it.field ?? ''),
          fromString: it.fromString != null ? String(it.fromString) : null,
          toString: it.toString != null ? String(it.toString) : null,
        })),
      };
    });
  }

  private static parseAdfToMarkdown(adf: any): string | null {
    if (!adf) return null;
    if (typeof adf === 'string') return this.convertWikiToMarkdown(adf);
    if (typeof adf !== 'object') return JSON.stringify(adf);

    if (adf.type === 'doc') {
      return (adf.content || [])
        .map((node: any) => this.parseNode(node))
        .filter(Boolean)
        .join('\n\n');
    }
    return JSON.stringify(adf);
  }

  private static convertWikiToMarkdown(wiki: string): string {
    if (!wiki) return '';
    
    let md = wiki;
    
    // Headers: h1. -> #, h2. -> ##, etc.
    md = md.replace(/^h([1-6])\.\s+(.*)$/gm, (match, level, content) => {
      return '#'.repeat(parseInt(level)) + ' ' + content;
    });
    
    // Bold: *text* -> **text**
    // We need to be careful with bullets, but usually bold is *text* and bullet is * space
    md = md.replace(/([^\*]|^)\*([^\*\s][^\*]*[^\*\s]|[^\*\s])\*([^\*]|$)/g, '$1**$2**$3');
    
    // Italic: _text_ -> *text*
    md = md.replace(/([^_]|^)_([^_ \s][^_]*[^_ \s]|[^_ \s])_([^_]|$)/g, '$1*$2*$3');
    
    // Strikethrough: -text- -> ~~text~~
    md = md.replace(/([^-]|^)-([^- \s][^-]*[^- \s]|[^- \s])-([^-]|$)/g, '$1~~$2~~$3');
    
    // Monospace: {{text}} -> `text`
    md = md.replace(/\{\{(.*?)\}\}/g, '`$1`');
    
    // Code blocks: {code} or {code:lang}
    md = md.replace(/\{code(?::(\w+))?\}([\s\S]*?)\{code\}/g, (match, lang, code) => {
      return `\`\`\`${lang || ''}\n${code.trim()}\n\`\`\``;
    });

    // Lists: Jira uses * for bullets, but markdown also does. 
    // However, Jira uses # for numbered lists, markdown uses 1.
    md = md.replace(/^#\s+(.*)$/gm, '1. $1');

    return md;
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
