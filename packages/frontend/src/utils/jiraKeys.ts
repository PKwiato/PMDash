/** Jira issue keys like PROJ-123 */
export const JIRA_ISSUE_KEY_REGEX = /[A-Z]+-\d+/g;

export function uniqueJiraKeysFromString(text: string): string[] {
  const matches = text.match(JIRA_ISSUE_KEY_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

export function collectJiraKeysFromNotes(notesList: { title: string; body?: string }[]): string[] {
  const keys = new Set<string>();
  for (const note of notesList) {
    for (const k of uniqueJiraKeysFromString(note.title)) keys.add(k);
    if (note.body) {
      for (const k of uniqueJiraKeysFromString(note.body)) keys.add(k);
    }
  }
  return Array.from(keys);
}
