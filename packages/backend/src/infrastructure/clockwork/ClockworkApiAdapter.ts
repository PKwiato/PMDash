import type { ClockworkWorklog } from '../../domain/ports/IJiraAdapter';
import type { IClockworkAdapter } from '../../domain/ports/IClockworkAdapter';
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

  async listWorklogs(startingAt: string, endingAt: string): Promise<ClockworkWorklog[]> {
    const out: ClockworkWorklog[] = [];
    let offset = 0;

    while (true) {
      const page = await this.client.get<ClockworkWorklogResponse[]>('/worklogs', {
        starting_at: startingAt,
        ending_at: endingAt,
        expand: 'authors',
        offset: String(offset),
      });

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
