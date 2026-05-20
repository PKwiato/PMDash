import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isEpicLinkedIssue,
  jiraEpicColorToCss,
  jiraEpicLabelBackground,
  jiraEpicLabelTextColor,
  programColorFromKey,
} from './jiraEpicColors';
import type { JiraLinkedIssueDto } from '../types/api';

const linked = (overrides: Partial<JiraLinkedIssueDto>): JiraLinkedIssueDto => ({
  id: '1',
  key: 'P-1',
  summary: 'Test',
  status: 'Open',
  priority: 'Medium',
  issueType: 'Story',
  ...overrides,
});

test('jiraEpicColorToCss maps ghx-label tokens', () => {
  assert.equal(jiraEpicColorToCss('ghx-label-10'), '#2584ff');
  assert.equal(jiraEpicColorToCss('ghx-label-1'), '#8d542e');
});

test('jiraEpicColorToCss passes through hex', () => {
  assert.equal(jiraEpicColorToCss('#ff00aa'), '#ff00aa');
});

test('isEpicLinkedIssue detects epic by type or epicKey', () => {
  assert.equal(isEpicLinkedIssue(linked({ issueType: 'Epic' })), true);
  assert.equal(isEpicLinkedIssue(linked({ issueType: 'Program' })), true);
  assert.equal(isEpicLinkedIssue(linked({ key: 'P-99', issueType: 'Story' }), 'P-99'), true);
  assert.equal(isEpicLinkedIssue(linked({ issueType: 'Story' }), 'P-99'), false);
});

test('jiraEpicLabelBackground uses Jira color when set', () => {
  assert.equal(jiraEpicLabelBackground('ghx-label-10'), '#2584ff');
  assert.equal(jiraEpicLabelTextColor('#2584ff'), '#FFFFFF');
  assert.equal(jiraEpicLabelTextColor('#B880E6'), '#1F1F1F');
});

test('jiraEpicLabelBackground differs per key without Jira color', () => {
  const a = jiraEpicLabelBackground(null, 'EPIC-1');
  const b = jiraEpicLabelBackground(null, 'EPIC-2');
  assert.notEqual(a, b);
  assert.equal(jiraEpicLabelBackground('ghx-label-6', 'EPIC-1'), '#5fa321');
});

test('programColorFromKey is stable', () => {
  assert.equal(programColorFromKey('BASE-10'), programColorFromKey('BASE-10'));
});

test('jiraEpicColorToCss returns null for empty or unknown', () => {
  assert.equal(jiraEpicColorToCss(null), null);
  assert.equal(jiraEpicColorToCss('unknown-token'), null);
});
