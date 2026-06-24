import assert from 'node:assert/strict';
import test from 'node:test';
import { WorklogAnalysisService, hydrateClockworkIssueKeys } from './WorklogAnalysisService';
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
    listBoardEpics: async () => [],
    listBoardPrograms: async () => [],
    listProgramsOverview: async () => [],
    listBoardIssues: async () => [],
    listBoardSprints: async () => [],
    getIssue: async () => {
      throw new Error('not used');
    },
    listIssuesByKeys: async () => [],
    resolveIssueKeysByIds: async () => new Map(),
    getBoardProgress: async () => ({ total: 0, byStatus: {} }),
    listClockworkWorklogs: async () => [] as ClockworkWorklog[],
    listBoardUsers: async () => boardUsers,
  };

  let receivedAuthorIds: string[] | undefined;
  const clockworkAdapter: IClockworkAdapter = {
    listWorklogs: async (_from, _to, query) => {
      receivedAuthorIds = query?.authorAccountIds ? [...query.authorAccountIds] : undefined;
      return worklogs;
    },
  };

  const service = new WorklogAnalysisService(jiraAdapter, clockworkAdapter);
  const analysis = await service.analyzeBoard(214, '2026-05-12', '2026-05-12');

  assert.deepEqual(receivedAuthorIds, ['user-1', 'user-2']);
  assert.equal(analysis.length, 2);

  const alice = analysis.find(item => item.user.accountId === 'user-1');
  const bob = analysis.find(item => item.user.accountId === 'user-2');

  assert.ok(alice);
  assert.equal(alice.totalSeconds, 9 * 3600);
  assert.equal(alice.inconsistencies.length, 0);
  assert.equal(alice.issueBreakdown.length, 2);
  assert.equal(alice.issueBreakdown[0]?.issueKey, 'SSP-1');
  assert.equal(alice.issueBreakdown[0]?.seconds, 8 * 3600);
  assert.equal(alice.issueBreakdown[0]?.logCount, 1);

  assert.ok(bob);
  assert.equal(bob.totalSeconds, 0);
  assert.equal(bob.inconsistencies.length, 1);
  assert.equal(bob.inconsistencies[0]?.type, 'missing_hours');
});

test('hydrateClockworkIssueKeys resolves issue keys from Jira issue ids', async () => {
  const worklogs: ClockworkWorklog[] = [
    {
      id: 1,
      issueKey: '',
      issueId: '305054',
      userAccountId: 'user-1',
      userName: 'Alice',
      date: '2026-06-07',
      timeSpentSeconds: 7200,
      description: '',
    },
  ];

  const hydrated = await hydrateClockworkIssueKeys(worklogs, async ids => {
    assert.deepEqual(ids, ['305054']);
    return new Map([['305054', 'STAT-164345']]);
  });

  assert.equal(hydrated[0]?.issueKey, 'STAT-164345');
});

test('WorklogAnalysisService hydrates Clockwork issue ids before building breakdown', async () => {
  const worklogsWithIds: ClockworkWorklog[] = [
    {
      id: 1,
      issueKey: '',
      issueId: '305054',
      userAccountId: 'user-1',
      userName: 'Alice Example',
      date: '2026-06-07',
      timeSpentSeconds: 7200,
      description: '',
    },
  ];

  const jiraAdapter: IJiraAdapter = {
    listBoards: async () => [],
    listBoardProjects: async () => [],
    listBoardEpics: async () => [],
    listBoardPrograms: async () => [],
    listProgramsOverview: async () => [],
    listBoardIssues: async () => [],
    listBoardSprints: async () => [],
    getIssue: async () => {
      throw new Error('not used');
    },
    listIssuesByKeys: async () => [],
    resolveIssueKeysByIds: async () => new Map([['305054', 'STAT-164345']]),
    getBoardProgress: async () => ({ total: 0, byStatus: {} }),
    listClockworkWorklogs: async () => [],
    listBoardUsers: async () => boardUsers,
  };

  const clockworkAdapter: IClockworkAdapter = {
    listWorklogs: async () => worklogsWithIds,
  };

  const service = new WorklogAnalysisService(jiraAdapter, clockworkAdapter);
  const analysis = await service.analyzeBoard(214, '2026-06-07', '2026-06-07');
  const alice = analysis.find(item => item.user.accountId === 'user-1');

  assert.ok(alice);
  assert.equal(alice.totalSeconds, 7200);
  assert.equal(alice.issueBreakdown.length, 1);
  assert.equal(alice.issueBreakdown[0]?.issueKey, 'STAT-164345');
});
