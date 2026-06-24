import assert from 'node:assert/strict';
import test from 'node:test';
import { ClockworkApiAdapter, mapClockworkWorklogResponse } from './ClockworkApiAdapter';
import type { ClockworkApiClient } from './ClockworkApiClient';

test('mapClockworkWorklogResponse maps author and issue fields', () => {
  const mapped = mapClockworkWorklogResponse({
    id: '10685',
    timeSpentSeconds: 2700,
    started: '2021-02-08T14:23:35Z',
    author: {
      accountId: 'user-1',
      displayName: 'Alice Example',
    },
    issue: {
      key: 'SSP-13',
    },
    comment: 'Investigation',
  });

  assert.equal(mapped.id, 10685);
  assert.equal(mapped.issueKey, 'SSP-13');
  assert.equal(mapped.userAccountId, 'user-1');
  assert.equal(mapped.userName, 'Alice Example');
  assert.equal(mapped.date, '2021-02-08');
  assert.equal(mapped.timeSpentSeconds, 2700);
  assert.equal(mapped.description, 'Investigation');
  assert.equal(mapped.started, '2021-02-08T14:23:35Z');
});

test('mapClockworkWorklogResponse maps top-level issueId when issue key is absent', () => {
  const mapped = mapClockworkWorklogResponse({
    id: '10294',
    timeSpentSeconds: 3600,
    started: '2023-04-03T02:15:00+02:00',
    author: { accountId: 'user-1' },
    issueId: '17843',
  });

  assert.equal(mapped.issueKey, '');
  assert.equal(mapped.issueId, '17843');
  assert.equal(mapped.timeSpentSeconds, 3600);
});

test('ClockworkApiAdapter paginates worklogs until a short page is returned', async () => {
  const calls: Array<Record<string, string | string[]>> = [];
  const client = {
    async get<T>(_path: string, params?: Record<string, string | string[]>): Promise<T> {
      calls.push(params ?? {});
      const offset = Number(params?.offset ?? '0');
      if (offset === 0) {
        return Array.from({ length: 10_000 }, (_, index) => ({
          id: index + 1,
          timeSpentSeconds: 60,
          started: '2026-05-01T09:00:00Z',
          author: { accountId: 'user-1', displayName: 'Alice Example' },
        })) as T;
      }

      return [
        {
          id: 10_001,
          timeSpentSeconds: 120,
          started: '2026-05-02T09:00:00Z',
          author: { accountId: 'user-2', displayName: 'Bob Example' },
        },
      ] as T;
    },
  } as ClockworkApiClient;

  const adapter = new ClockworkApiAdapter(client);
  const worklogs = await adapter.listWorklogs('2026-05-01', '2026-05-31');

  assert.equal(worklogs.length, 10_001);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].starting_at, '2026-05-01');
  assert.equal(calls[0].ending_at, '2026-05-31');
  assert.equal(calls[0].expand, 'authors');
  assert.equal(calls[0].offset, '0');
  assert.equal(calls[1].offset, '10000');
});

test('ClockworkApiAdapter scopes worklogs to author account ids', async () => {
  const calls: Array<Record<string, string | string[]>> = [];
  const client = {
    async get<T>(_path: string, params?: Record<string, string | string[]>): Promise<T> {
      calls.push(params ?? {});
      const accountId = params?.account_id;
      if (accountId === 'user-1') {
        return [
          {
            id: 1,
            timeSpentSeconds: 3600,
            started: '2026-05-01T09:00:00Z',
            author: { accountId: 'user-1' },
            issue: { key: 'SSP-1' },
          },
        ] as T;
      }
      return [
        {
          id: 2,
          timeSpentSeconds: 1800,
          started: '2026-05-01T10:00:00Z',
          author: { accountId: 'user-2' },
          issue: { key: 'SSP-2' },
        },
      ] as T;
    },
  } as ClockworkApiClient;

  const adapter = new ClockworkApiAdapter(client);
  const worklogs = await adapter.listWorklogs('2026-05-01', '2026-05-31', {
    authorAccountIds: ['user-1', 'user-2'],
  });

  assert.equal(worklogs.length, 2);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].account_id, 'user-1');
  assert.equal(calls[1].account_id, 'user-2');
});
