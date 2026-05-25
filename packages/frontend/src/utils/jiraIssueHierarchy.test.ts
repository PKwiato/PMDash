import assert from 'node:assert/strict';
import test from 'node:test';
import type { JiraIssueDto } from '../types/api';
import {
  ancestorsForDisplay,
  collectProgramKeysToHydrate,
  programBadgeForIssue,
  resolveEpic,
  resolveProgramKey,
} from './jiraIssueHierarchy';

const baseIssue = (overrides: Partial<JiraIssueDto>): JiraIssueDto => ({
  id: '1',
  key: 'PROJ-1',
  summary: 'Task',
  description: null,
  status: 'Open',
  assignee: null,
  assigneeAvatarUrl: null,
  priority: 'Medium',
  issueType: 'Task',
  epicKey: null,
  ...overrides,
});

test('resolveProgramKey walks parent chain to epic on ancestor', () => {
  const program = baseIssue({ key: 'PROG-1', issueType: 'Program' });
  const story = baseIssue({ key: 'ST-1', issueType: 'Story', parent: { id: 'p', key: 'PROG-1', summary: 'P', status: 'Open', priority: 'M', issueType: 'Program' } });
  const sub = baseIssue({ key: 'SUB-1', issueType: 'Sub-task', parent: { id: 's', key: 'ST-1', summary: 'S', status: 'Open', priority: 'M', issueType: 'Story' } });
  const issues = [program, story, sub];
  story.epicKey = 'PROG-1';
  assert.equal(resolveProgramKey(sub, issues), 'PROG-1');
});

test('resolveEpic returns issue from store when present', () => {
  const epic = baseIssue({ id: '2', key: 'PROJ-10', summary: 'My Epic', issueType: 'Epic', epicColor: 'ghx-label-4' });
  const task = baseIssue({ key: 'PROJ-99', epicKey: 'PROJ-10' });
  const resolved = resolveEpic(task, [epic, task]);
  assert.equal(resolved?.key, 'PROJ-10');
  assert.equal(resolved?.summary, 'My Epic');
  assert.equal(resolved?.color, 'ghx-label-4');
});

test('programBadgeForIssue returns enriched epic from epicKey', () => {
  const epic = baseIssue({ id: '2', key: 'PROJ-10', summary: 'Customer Portal', issueType: 'Epic', epicColor: 'ghx-label-8' });
  const sub = baseIssue({ key: 'PROJ-30', epicKey: 'PROJ-10' });
  const badge = programBadgeForIssue(sub, [epic, sub]);
  assert.equal(badge?.key, 'PROJ-10');
  assert.equal(badge?.color, 'ghx-label-8');
});

test('programBadgeForIssue uses parent when type is Program and no epicKey', () => {
  const sub = baseIssue({
    key: 'BASE-3375',
    parent: {
      id: '9',
      key: 'PROG-1',
      summary: 'NEW "CUSTOMER PORTAL"',
      status: 'Open',
      priority: 'Medium',
      issueType: 'Program',
      color: 'ghx-label-8',
    },
  });
  const badge = programBadgeForIssue(sub, [sub]);
  assert.equal(badge?.key, 'PROG-1');
  assert.equal(badge?.summary, 'NEW "CUSTOMER PORTAL"');
});

test('collectProgramKeysToHydrate lists epics missing from board', () => {
  const epic = baseIssue({ key: 'EPIC-1', epicColor: 'ghx-label-1' });
  const story = baseIssue({ key: 'S-1', epicKey: 'EPIC-1' });
  const story2 = baseIssue({ key: 'S-2', epicKey: 'EPIC-2' });
  assert.deepEqual(collectProgramKeysToHydrate([story, story2]).sort(), ['EPIC-1', 'EPIC-2']);
  assert.deepEqual(collectProgramKeysToHydrate([epic, story, story2]).sort(), ['EPIC-2']);
});

test('ancestorsForDisplay orders epic then parent and deduplicates', () => {
  const epic = baseIssue({ id: '2', key: 'PROJ-10', summary: 'Epic', issueType: 'Epic' });
  const story = baseIssue({
    id: '3',
    key: 'PROJ-20',
    summary: 'Story',
    issueType: 'Story',
    parent: undefined,
  });
  const sub = baseIssue({
    id: '4',
    key: 'PROJ-30',
    epicKey: 'PROJ-10',
    parent: {
      id: '3',
      key: 'PROJ-20',
      summary: 'Story',
      status: 'Open',
      priority: 'Medium',
      issueType: 'Story',
    },
  });

  const ancestors = ancestorsForDisplay(sub, [epic, story, sub]);
  assert.equal(ancestors.length, 2);
  assert.equal(ancestors[0]!.key, 'PROJ-10');
  assert.equal(ancestors[1]!.key, 'PROJ-20');
});

test('ancestorsForDisplay skips duplicate when parent is epic', () => {
  const sub = baseIssue({
    key: 'PROJ-30',
    epicKey: 'PROJ-10',
    parent: {
      id: '2',
      key: 'PROJ-10',
      summary: 'Epic as parent',
      status: 'Open',
      priority: 'Medium',
      issueType: 'Epic',
    },
  });

  const ancestors = ancestorsForDisplay(sub, []);
  assert.equal(ancestors.length, 1);
  assert.equal(ancestors[0]!.key, 'PROJ-10');
});
