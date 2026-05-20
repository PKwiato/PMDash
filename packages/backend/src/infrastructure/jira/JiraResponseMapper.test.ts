import assert from 'node:assert/strict';
import test from 'node:test';
import { JiraResponseMapper } from './JiraResponseMapper';

test('toIssue maps parent and epicKey separately', () => {
  const issue = JiraResponseMapper.toIssue({
    id: '10001',
    key: 'PROJ-42',
    fields: {
      summary: 'Sub-task title',
      status: { name: 'In Progress' },
      issuetype: { name: 'Sub-task' },
      customfield_10014: 'PROJ-10',
      customfield_10013: 'ghx-label-6',
      parent: {
        id: '10002',
        key: 'PROJ-20',
        fields: {
          summary: 'Parent story',
          status: { name: 'To Do' },
          priority: { name: 'High' },
          issuetype: { name: 'Story' },
          customfield_10013: 'ghx-label-10',
        },
      },
    },
  });

  assert.equal(issue.epicKey, 'PROJ-10');
  assert.ok(issue.parent);
  assert.equal(issue.parent!.key, 'PROJ-20');
  assert.equal(issue.parent!.summary, 'Parent story');
  assert.equal(issue.parent!.issueType, 'Story');
  assert.equal(issue.epicColor, 'ghx-label-6');
  assert.equal(issue.parent!.color, 'ghx-label-10');
});

test('toIssue parses epic key and color from object-shaped custom fields', () => {
  const issue = JiraResponseMapper.toIssue({
    id: '1',
    key: 'X-1',
    fields: {
      summary: 'Story',
      status: { name: 'Open' },
      issuetype: { name: 'Story' },
      customfield_10014: { key: 'EPIC-99' },
      customfield_10013: { value: 'ghx-label-7' },
    },
  });
  assert.equal(issue.epicKey, 'EPIC-99');
  assert.equal(issue.epicColor, 'ghx-label-7');
});

test('toIssue does not use parent.key as epicKey fallback', () => {
  const issue = JiraResponseMapper.toIssue({
    id: '10003',
    key: 'PROJ-43',
    fields: {
      summary: 'Sub-task without epic link',
      status: { name: 'Open' },
      issuetype: { name: 'Sub-task' },
      parent: {
        id: '10004',
        key: 'PROJ-21',
        fields: { summary: 'Story only' },
      },
    },
  });

  assert.equal(issue.epicKey, null);
  assert.equal(issue.parent?.key, 'PROJ-21');
});
