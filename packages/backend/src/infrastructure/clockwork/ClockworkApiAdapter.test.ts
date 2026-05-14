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
