import assert from 'node:assert/strict';
import test from 'node:test';
import { businessDaysUtcBetween } from './businessDaysUtc';
import {
  extractStatusTransitions,
  statusDwellBusinessDaysFromChangelog,
} from './statusDwellFromChangelog';

test('businessDaysUtcBetween excludes Sat/Sun in UTC', () => {
  // Monday 2024-06-10 12:00 UTC → Wednesday 2024-06-12 12:00 UTC (2 full weekdays as fraction)
  const mon = Date.UTC(2024, 5, 10, 12, 0, 0, 0);
  const wed = Date.UTC(2024, 5, 12, 12, 0, 0, 0);
  const d = businessDaysUtcBetween(mon, wed);
  assert.ok(d > 1.9 && d < 2.1, `expected ~2 business days, got ${d}`);
});

test('businessDaysUtcBetween skips weekend in the middle', () => {
  // Friday 2024-06-07 12:00 UTC → Tuesday 2024-06-11 12:00 UTC (Fri PM + Mon AM + Tue AM in business split)
  const fri = Date.UTC(2024, 5, 7, 12, 0, 0, 0);
  const tue = Date.UTC(2024, 5, 11, 12, 0, 0, 0);
  const d = businessDaysUtcBetween(fri, tue);
  assert.ok(d > 1.5 && d < 2.5, `expected about 2 business days across weekend, got ${d}`);
});

test('statusDwellBusinessDaysFromChangelog aggregates repeated status', () => {
  const created = '2024-06-10T10:00:00.000Z';
  const t1 = '2024-06-11T10:00:00.000Z';
  const t2 = '2024-06-12T10:00:00.000Z';
  const histories = [
    {
      id: '1',
      created: t1,
      items: [{ field: 'status', fromString: 'To Do', toString: 'In Progress' }],
    },
    {
      id: '2',
      created: t2,
      items: [{ field: 'status', fromString: 'In Progress', toString: 'To Do' }],
    },
  ];
  const rows = statusDwellBusinessDaysFromChangelog(created, 'To Do', histories, Date.UTC(2024, 5, 13, 10, 0, 0, 0));
  const byName = Object.fromEntries(rows.map(r => [r.status, r.businessDays]));
  assert.ok(byName['To Do'] != null && byName['In Progress'] != null);
  assert.ok(byName['To Do']! > 0 && byName['In Progress']! > 0);
});

test('extractStatusTransitions sorts by time', () => {
  const h = [
    {
      id: '2',
      created: '2024-01-02T00:00:00.000Z',
      items: [{ field: 'status', fromString: 'B', toString: 'C' }],
    },
    {
      id: '1',
      created: '2024-01-01T00:00:00.000Z',
      items: [{ field: 'status', fromString: 'A', toString: 'B' }],
    },
  ];
  const tr = extractStatusTransitions(h);
  assert.equal(tr[0]!.fromStatus, 'A');
  assert.equal(tr[1]!.toStatus, 'C');
});
