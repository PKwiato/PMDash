import assert from 'node:assert/strict';
import test from 'node:test';
import type { JiraIssueDto } from '../types/api';
import type { UserAnalysis } from '../stores/clockworkStore';
import {
  activeTeamTasksFromClockwork,
  buildPersonWorkloads,
  collectClockworkIssueKeys,
  collectRelatedProgramKeysForIssues,
  computeBiweeklyDiagnostics,
  missingIssueKeys,
  totalTeamWorklogSeconds,
} from './biweeklySummary';

const teamTask = (
  key: string,
  summary: string,
  assignee: string | null = null,
  statscoreTeam: string | null = 'Collector',
): JiraIssueDto => ({
  id: key,
  key,
  summary,
  description: null,
  status: 'In Progress',
  assignee,
  assigneeAvatarUrl: null,
  priority: 'Medium',
  issueType: 'Task',
  epicKey: null,
  statscoreTeam,
});

const analysis: UserAnalysis[] = [
  {
    user: { accountId: 'u1', displayName: 'Alice' },
    totalSeconds: 10 * 3600,
    inconsistencies: [],
    issueBreakdown: [
      { issueKey: 'COL-1', seconds: 6 * 3600, logCount: 2 },
      { issueKey: 'COL-2', seconds: 2 * 3600, logCount: 1 },
      { issueKey: 'OTHER-9', seconds: 2 * 3600, logCount: 1 },
    ],
  },
];

test('collectClockworkIssueKeys gathers keys from all board members', () => {
  assert.deepEqual(collectClockworkIssueKeys(analysis).sort(), ['COL-1', 'COL-2', 'OTHER-9']);
});

test('buildPersonWorkloads filters by team after Jira join', () => {
  const allIssues = [
    teamTask('COL-1', 'Team task one', 'Alice'),
    teamTask('COL-2', 'Team task two'),
    teamTask('OTHER-9', 'Outside team', null, 'Other Team'),
  ];

  const workloads = buildPersonWorkloads(analysis, allIssues, ['Collector']);

  assert.equal(workloads.length, 1);
  assert.equal(workloads[0]?.totalSeconds, 8 * 3600);
  assert.equal(workloads[0]?.issues.length, 2);
  assert.equal(workloads[0]?.issues[0]?.issueKey, 'COL-1');
  assert.equal(workloads[0]?.issues[0]?.isAssignee, true);
  assert.equal(workloads[0]?.issues[0]?.jiraLinked, true);
});

test('activeTeamTasksFromClockwork starts from Clockwork keys', () => {
  const allIssues = [
    teamTask('COL-1', 'One'),
    teamTask('COL-2', 'Two'),
    teamTask('COL-99', 'On board but no worklog'),
    teamTask('OTHER-9', 'Other', null, 'Other Team'),
  ];

  const active = activeTeamTasksFromClockwork(analysis, allIssues, ['Collector']);
  assert.deepEqual(active.map(t => t.key).sort(), ['COL-1', 'COL-2']);
});

test('totalTeamWorklogSeconds sums filtered workloads', () => {
  const allIssues = [teamTask('COL-1', 'One'), teamTask('COL-2', 'Two')];
  const workloads = buildPersonWorkloads(analysis, allIssues, ['Collector']);
  assert.equal(totalTeamWorklogSeconds(workloads), 8 * 3600);
});

test('collectRelatedProgramKeysForIssues gathers epic and program parent keys', () => {
  const issues = [
    {
      ...teamTask('COL-1', 'Task'),
      epicKey: 'EPIC-1',
      parent: { id: 'p1', key: 'PROG-1', summary: 'Prog', status: 'Open', priority: 'M', issueType: 'Program' },
    },
  ];
  assert.deepEqual(collectRelatedProgramKeysForIssues(issues).sort(), ['EPIC-1', 'PROG-1']);
});

test('computeBiweeklyDiagnostics counts join and team filter stages', () => {
  const allIssues = [
    teamTask('COL-1', 'One'),
    teamTask('COL-2', 'Two'),
    teamTask('OTHER-9', 'Other', null, 'Other Team'),
  ];
  const diag = computeBiweeklyDiagnostics(analysis, allIssues, ['Collector']);
  assert.equal(diag.clockworkUsers, 1);
  assert.equal(diag.clockworkKeys, 3);
  assert.equal(diag.jiraLinked, 3);
  assert.equal(diag.teamMatched, 2);
  assert.equal(diag.filteredOut, 1);
  assert.equal(diag.totalClockworkHours, 10);
});

test('missingIssueKeys returns keys not in store', () => {
  assert.deepEqual(missingIssueKeys(['COL-1', 'COL-2'], [teamTask('COL-1', 'a')]), ['COL-2']);
});

test('statscoreTeam on fetched issue passes filter without program on overview', () => {
  const standalone = teamTask('COL-77', 'Fetched from Clockwork only', null, 'Collector');
  const allIssues = [
    teamTask('COL-99', 'On overview board', null, 'Collector'),
    standalone,
    teamTask('OTHER-9', 'Other team', null, 'Other Team'),
  ];
  const cwOnly: UserAnalysis[] = [
    {
      user: { accountId: 'u1', displayName: 'Alice' },
      totalSeconds: 4 * 3600,
      inconsistencies: [],
      issueBreakdown: [{ issueKey: 'COL-77', seconds: 4 * 3600, logCount: 1 }],
    },
  ];

  const active = activeTeamTasksFromClockwork(cwOnly, allIssues, ['Collector']);
  assert.deepEqual(active.map(t => t.key), ['COL-77']);

  const workloads = buildPersonWorkloads(cwOnly, allIssues, ['Collector']);
  assert.equal(workloads[0]?.issues[0]?.issueKey, 'COL-77');
});
