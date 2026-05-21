/** Derive a STATSCORE Team label from the globally selected Jira board name. */
export function teamLabelFromBoardName(boardName: string): string {
  return boardName
    .replace(/^team\s+/i, '')
    .replace(/^statscore\s+/i, '')
    .trim();
}

/** Pick the best default team filter value for a board among known Jira team values. */
export function defaultTeamFilterForBoard(
  boardName: string,
  availableTeams: readonly string[],
): string[] {
  const boardTrimmed = boardName.trim();
  const boardExact = availableTeams.find(t => t.toLowerCase() === boardTrimmed.toLowerCase());
  if (boardExact) return [boardExact];

  const hint = teamLabelFromBoardName(boardName);
  if (!hint) return availableTeams.length > 0 ? [availableTeams[0]!] : [];

  const exact = availableTeams.find(t => t.toLowerCase() === hint.toLowerCase());
  if (exact) return [exact];

  const partial = availableTeams.find(t => {
    const tl = t.toLowerCase();
    const hl = hint.toLowerCase();
    return tl.includes(hl) || hl.includes(tl);
  });
  if (partial) return [partial];

  // Board name does not map to a known team value — avoid hiding every program.
  return [];
}

export function teamMatchesSelection(
  programTeam: string | null | undefined,
  selectedTeams: readonly string[],
  options?: { includeUnassigned?: boolean },
): boolean {
  if (selectedTeams.length === 0) return true;
  if (!programTeam?.trim()) return options?.includeUnassigned ?? false;
  const t = programTeam.trim().toLowerCase();
  return selectedTeams.some(s => {
    const f = s.trim().toLowerCase();
    if (!f) return false;
    return t === f || t.includes(f) || f.includes(t);
  });
}

export function issueMatchesSearch(
  summary: string,
  key: string,
  extra: string | null | undefined,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${summary} ${key} ${extra ?? ''}`.toLowerCase();
  return hay.includes(q);
}
