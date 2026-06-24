import type { ClockworkWorklog } from './IJiraAdapter';

export interface ClockworkWorklogQuery {
  /** Jira account IDs — narrows Clockwork API to board members only. */
  authorAccountIds?: readonly string[];
}

export interface IClockworkAdapter {
  listWorklogs(
    startingAt: string,
    endingAt: string,
    query?: ClockworkWorklogQuery,
  ): Promise<ClockworkWorklog[]>;
}
