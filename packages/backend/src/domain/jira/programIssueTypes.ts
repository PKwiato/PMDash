export function isProgramIssueType(issueType: string): boolean {
  return /\b(epic|program|programme|initiative)\b/i.test(issueType);
}
