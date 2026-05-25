import assert from 'node:assert/strict';
import test from 'node:test';
import type { JiraIssueDto } from '../types/api';
import {
  buildProgramsFromIssues,
  computeProgramsOverviewStats,
  isProgramCompleted,
  programMatchesLifecycleFilter,
  taskDisplayStatus,
} from './jiraPrograms';

const issue = (overrides: Partial<JiraIssueDto>): JiraIssueDto => ({
  id: '1',
  key: 'X-1',
  summary: 'Task',
  description: null,
  status: 'To Do',
  assignee: null,
  assigneeAvatarUrl: null,
  priority: 'Medium',
  issueType: 'Story',
  epicKey: null,
  ...overrides,
});

test('buildProgramsFromIssues groups tasks under epic', () => {
  const epic = issue({
    id: '2',
    key: 'EPIC-1',
    summary: 'Cloud Migration',
    issueType: 'Epic',
    epicColor: 'ghx-label-4',
    status: 'In Progress',
  });
  const t1 = issue({ key: 'T-1', epicKey: 'EPIC-1', status: 'Done' });
  const t2 = issue({ key: 'T-2', epicKey: 'EPIC-1', status: 'In Progress' });
  const programs = buildProgramsFromIssues([epic, t1, t2]);
  assert.equal(programs.length, 1);
  assert.equal(programs[0]!.done, 1);
  assert.equal(programs[0]!.inProgress, 1);
  assert.equal(programs[0]!.progressPercent, 50);
});

test('computeProgramsOverviewStats', () => {
  const stats = computeProgramsOverviewStats([
    issue({ key: 'A', status: 'Done' }),
    issue({ key: 'B', status: 'In Progress' }),
  ]);
  assert.equal(stats.totalTasks, 2);
  assert.equal(stats.doneTasks, 1);
  assert.equal(stats.completionRate, 50);
});

test('taskDisplayStatus maps blocked to AT RISK', () => {
  assert.equal(taskDisplayStatus(issue({ status: 'Blocked' })), 'AT RISK');
});

test('isProgramCompleted uses Jira status or all tasks done', () => {
  assert.equal(
    isProgramCompleted({ status: 'Done', total: 5, done: 2, progressPercent: 40 }),
    true,
  );
  assert.equal(
    isProgramCompleted({ status: 'W toku', total: 4, done: 4, progressPercent: 100 }),
    true,
  );
  assert.equal(
    isProgramCompleted({ status: 'W toku', total: 4, done: 2, progressPercent: 50 }),
    false,
  );
});

test('programMatchesLifecycleFilter', () => {
  const active = { status: 'W toku', total: 2, done: 1, progressPercent: 50 };
  const done = { status: 'Gotowe', total: 0, done: 0, progressPercent: 0 };
  assert.equal(programMatchesLifecycleFilter(active, 'active'), true);
  assert.equal(programMatchesLifecycleFilter(active, 'completed'), false);
  assert.equal(programMatchesLifecycleFilter(done, 'completed'), true);
  assert.equal(programMatchesLifecycleFilter(done, 'active'), false);
});
