import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultTeamFilterForBoard,
  teamLabelFromBoardName,
  teamMatchesSelection,
} from './jiraTeamFilter';

test('teamLabelFromBoardName strips Team / STATSCORE prefix', () => {
  assert.equal(teamLabelFromBoardName('Team Collector'), 'Collector');
  assert.equal(teamLabelFromBoardName('STATSCORE Base'), 'Base');
});

test('defaultTeamFilterForBoard prefers full board name match', () => {
  const teams = ['Team Collector', 'Team Base'];
  assert.deepEqual(defaultTeamFilterForBoard('Team Collector', teams), ['Team Collector']);
});

test('defaultTeamFilterForBoard prefers exact then partial match', () => {
  const teams = ['Collector', 'Base', 'Integrations'];
  assert.deepEqual(defaultTeamFilterForBoard('Team Collector', teams), ['Collector']);
  assert.deepEqual(defaultTeamFilterForBoard('STATSCORE Base', teams), ['Base']);
  assert.deepEqual(defaultTeamFilterForBoard('Team Integra', teams), ['Integrations']);
});

test('defaultTeamFilterForBoard returns empty when board hint matches no team', () => {
  const teams = ['Collector', 'Base'];
  assert.deepEqual(defaultTeamFilterForBoard('Team Unknown', teams), []);
});

test('teamMatchesSelection is case-insensitive and supports partial match', () => {
  assert.equal(teamMatchesSelection('Collector', ['collector']), true);
  assert.equal(teamMatchesSelection('STATSCORE Collector', ['Collector']), true);
  assert.equal(teamMatchesSelection(null, ['Collector']), false);
  assert.equal(teamMatchesSelection(null, ['Collector'], { includeUnassigned: true }), true);
});
