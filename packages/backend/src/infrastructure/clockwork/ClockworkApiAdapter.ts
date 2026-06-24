import type { ClockworkWorklog } from '../../domain/ports/IJiraAdapter';
import type { ClockworkWorklogQuery, IClockworkAdapter } from '../../domain/ports/IClockworkAdapter';
import { ClockworkApiClient } from './ClockworkApiClient';

const PAGE_SIZE = 10_000;

interface ClockworkAuthor {
  accountId?: string;
  displayName?: string;
}

interface ClockworkIssue {
  id?: string;
  key?: string;
}

interface ClockworkWorklogResponse {
  id: string | number;
  timeSpentSeconds: number;
  started: string;
  author?: ClockworkAuthor;
  issue?: ClockworkIssue;
  issueId?: string | number;
  comment?: string;
}

export function mapClockworkWorklogResponse(worklog: ClockworkWorklogResponse): ClockworkWorklog {
  const startedDate = worklog.started.split('T')[0];
  const issueId = worklog.issue?.id ?? worklog.issueId;
  return {
    id: Number(worklog.id),
    issueKey: worklog.issue?.key ?? '',
    issueId: issueId != null ? String(issueId) : undefined,
    userAccountId: worklog.author?.accountId ?? '',
    userName: worklog.author?.displayName ?? '',
    date: startedDate,
    timeSpentSeconds: worklog.timeSpentSeconds,
    description: worklog.comment ?? '',
    started: worklog.started,
  };
}

export class ClockworkApiAdapter implements IClockworkAdapter {
  constructor(private readonly client: ClockworkApiClient) {}

  async listWorklogs(
    startingAt: string,
    endingAt: string,
    query?: ClockworkWorklogQuery,
  ): Promise<ClockworkWorklog[]> {
    const authorIds = [...new Set((query?.authorAccountIds ?? []).map(id => id.trim()).filter(Boolean))];
    if (authorIds.length === 0) {
      return this.fetchWorklogPages(startingAt, endingAt);
    }

    const byId = new Map<number, ClockworkWorklog>();
    const pages = await Promise.all(
      authorIds.map(accountId => this.fetchWorklogPages(startingAt, endingAt, accountId)),
    );
    for (const worklogs of pages) {
      for (const worklog of worklogs) {
        byId.set(worklog.id, worklog);
      }
    }
    return [...byId.values()];
  }

  private async fetchWorklogPages(
    startingAt: string,
    endingAt: string,
    accountId?: string,
  ): Promise<ClockworkWorklog[]> {
    const out: ClockworkWorklog[] = [];
    let offset = 0;

    while (true) {
      const params: Record<string, string | string[]> = {
        starting_at: startingAt,
        ending_at: endingAt,
        expand: 'authors',
        offset: String(offset),
      };
      if (accountId) {
        params.account_id = accountId;
      }

      const page = await this.client.get<ClockworkWorklogResponse[]>('/worklogs', params);

      for (const worklog of page) {
        out.push(mapClockworkWorklogResponse(worklog));
      }

      if (page.length < PAGE_SIZE) {
        break;
      }

      offset += PAGE_SIZE;
    }

    return out;
  }
}
