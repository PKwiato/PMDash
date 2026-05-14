import assert from 'node:assert/strict';
import test from 'node:test';
import { WorklogAnalysisService } from './WorklogAnalysisService';
import type { IClockworkAdapter } from '../../domain/ports/IClockworkAdapter';
import type { ClockworkWorklog, IJiraAdapter, JiraUser } from '../../domain/ports/IJiraAdapter';

const boardUsers: JiraUser[] = [
  { accountId: 'user-1', displayName: 'Alice Example' },
  { accountId: 'user-2', displayName: 'Bob Example' },
];

const worklogs: ClockworkWorklog[] = [
  {
    id: 1,
    issueKey: 'SSP-1',
    userAccountId: 'user-1',
    userName: 'Alice Example',
    date: '2026-05-12',
    timeSpentSeconds: 8 * 3600,
    description: '',
    started: '2026-05-12T08:00:00Z',
  },
  {
    id: 2,
    issueKey: 'OTHER-1',
    userAccountId: 'user-1',
    userName: 'Alice Example',
    date: '2026-05-12',
    timeSpentSeconds: 3600,
    description: '',
    started: '2026-05-12T17:00:00Z',
  },
  {
    id: 3,
    issueKey: 'OTHER-2',
    userAccountId: 'outsider',
    userName: 'Outsider',
    date: '2026-05-12',
    timeSpentSeconds: 5 * 3600,
    description: '',
    started: '2026-05-12T10:00:00Z',
  },
];

test('WorklogAnalysisService keeps only board users and sums their Clockwork hours', async () => {
  const jiraAdapter: IJiraAdapter = {
    listBoards: async () => [],
    listBoardProjects: async () => [],
    listBoardIssues: async () => [],
    listBoardSprints: async () => [],
    getIssue: async () => {
      throw new Error('not used');
    },
    listIssuesByKeys: async () => [],
    getBoardProgress: async () => ({ total: 0, byStatus: {} }),
    listBoardUsers: async () => boardUsers,
  };

  const clockworkAdapter: IClockworkAdapter = {
    listWorklogs: async () => worklogs,
  };

  const service = new WorklogAnalysisService(jiraAdapter, clockworkAdapter);
  const analysis = await service.analyzeBoard(214, '2026-05-12', '2026-05-12');

  assert.equal(analysis.length, 2);

  const alice = analysis.find(item => item.user.accountId === 'user-1');
  const bob = analysis.find(item => item.user.accountId === 'user-2');

  assert.ok(alice);
  assert.equal(alice.totalSeconds, 9 * 3600);
  assert.equal(alice.inconsistencies.length, 0);

  assert.ok(bob);
  assert.equal(bob.totalSeconds, 0);
  assert.equal(bob.inconsistencies.length, 1);
  assert.equal(bob.inconsistencies[0]?.type, 'missing_hours');
});
