import type { JiraLinkedIssueDto } from '../types/api';

/** Fallback when Jira color is not yet loaded (neutral, not epic purple). */
export const JIRA_EPIC_LABEL_FALLBACK_BG = '#6B778C';
export const JIRA_EPIC_LABEL_TEXT = '#1F1F1F';

/** Epic, Program, Initiative — issues shown as colored Jira program badges. */
export function isProgramIssueType(issueType: string): boolean {
  return /\b(epic|program|programme|initiative)\b/i.test(issueType);
}

export function isEpicLinkedIssue(
  ref: JiraLinkedIssueDto,
  epicKey?: string | null,
): boolean {
  if (epicKey && ref.key.toUpperCase() === epicKey.toUpperCase()) return true;
  return isProgramIssueType(ref.issueType);
}

/** Jira Cloud epic color tokens (ghx-label-*) → hex (backlog / roadmap). */
const GHX_LABEL_HEX: Record<string, string> = {
  color_1: '#8d542e',
  'ghx-label-1': '#8d542e',
  'ghx-label-2': '#ff8b00',
  'ghx-label-3': '#ffab01',
  'ghx-label-4': '#0052cc',
  'ghx-label-5': '#505f79',
  'ghx-label-6': '#5fa321',
  'ghx-label-7': '#cd4288',
  'ghx-label-8': '#5143aa',
  'ghx-label-9': '#ff8f73',
  'ghx-label-10': '#2584ff',
  'ghx-label-11': '#018da6',
  'ghx-label-12': '#6b778c',
  'ghx-label-13': '#03875a',
  'ghx-label-14': '#de350a',
};

const GHX_LABEL_KEYS = Object.keys(GHX_LABEL_HEX).filter(k => k.startsWith('ghx-label-'));

/** Converts Jira epic color token or hex to a CSS color, or null if unknown. */
export function jiraEpicColorToCss(color: string | null | undefined): string | null {
  if (!color?.trim()) return null;
  const raw = color.trim();
  if (raw.startsWith('#')) return raw;
  const mapped = GHX_LABEL_HEX[raw.toLowerCase()] ?? GHX_LABEL_HEX[raw];
  return mapped ?? null;
}

/** Stable palette slot per program key until Jira color is fetched. */
export function programColorFromKey(issueKey: string): string {
  let hash = 0;
  for (let i = 0; i < issueKey.length; i++) {
    hash = (hash * 31 + issueKey.charCodeAt(i)) >>> 0;
  }
  const label = GHX_LABEL_KEYS[hash % GHX_LABEL_KEYS.length] ?? 'ghx-label-1';
  return GHX_LABEL_HEX[label]!;
}

/** Background for program badge: Jira color first, then per-key palette (never one purple for all). */
export function jiraEpicLabelBackground(
  color: string | null | undefined,
  issueKey?: string,
): string {
  const fromJira = jiraEpicColorToCss(color);
  if (fromJira) return fromJira;
  if (issueKey?.trim()) return programColorFromKey(issueKey.trim());
  return JIRA_EPIC_LABEL_FALLBACK_BG;
}

/** Dark or light text on epic badge (Jira-style contrast). */
export function jiraEpicLabelTextColor(backgroundHex: string): string {
  const hex = backgroundHex.replace('#', '');
  if (hex.length !== 6) return JIRA_EPIC_LABEL_TEXT;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? JIRA_EPIC_LABEL_TEXT : '#FFFFFF';
}
