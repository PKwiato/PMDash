import assert from 'node:assert/strict';
import test from 'node:test';
import { computePrStats } from './PullRequestStatsService';
import type { GithubPullRequest } from '../../domain/ports/IGithubAdapter';

const now = new Date('2026-07-14T18:00:00Z');

const basePr: GithubPullRequest = {
  number: 1,
  title: 'Test PR',
  state: 'MERGED',
  authorLogin: 'alice',
  authorAvatarUrl: 'https://example.com/alice.png',
  createdAt: '2026-07-10T10:00:00Z',
  mergedAt: '2026-07-12T10:00:00Z',
  closedAt: '2026-07-12T10:00:00Z',
  additions: 100,
  deletions: 50,
  changedFiles: 3,
  reviewers: ['bob'],
};

test('computePrStats aggregates health KPIs and author activity', () => {
  const pullRequests: GithubPullRequest[] = [
    basePr,
    {
      ...basePr,
      number: 2,
      authorLogin: 'bob',
      authorAvatarUrl: 'https://example.com/bob.png',
      createdAt: '2026-07-14T08:00:00Z',
      mergedAt: '2026-07-14T16:00:00Z',
      closedAt: '2026-07-14T16:00:00Z',
      additions: 200,
      deletions: 0,
    },
    {
      ...basePr,
      number: 3,
      title: 'Stale without review',
      state: 'OPEN',
      createdAt: '2026-07-08T09:00:00Z',
      mergedAt: null,
      closedAt: null,
      reviewers: [],
    },
    {
      ...basePr,
      number: 4,
      title: 'Large open PR',
      state: 'OPEN',
      createdAt: '2026-07-13T08:00:00Z',
      mergedAt: null,
      closedAt: null,
      additions: 600,
      deletions: 0,
      reviewers: ['carol'],
    },
  ];

  const stats = computePrStats(pullRequests, '2026-07-08', '2026-07-14', now);

  assert.equal(stats.health.mergedCount, 2);
  assert.equal(stats.health.openBacklog, 2);
  assert.equal(stats.health.staleCount, 1);
  assert.equal(stats.health.reviewCoveragePercent, 100);
  assert.equal(stats.authorActivity.length, 2);
  assert.equal(stats.authorActivity[0]!.login, 'alice');
  assert.ok(stats.needsAttention.some(p => p.number === 3 && p.reason === 'stale_no_review'));
  assert.ok(stats.reviewerActivity.some(r => r.login === 'bob'));
});

test('computePrStats returns empty activity when no merged PRs', () => {
  const stats = computePrStats(
    [{ ...basePr, state: 'OPEN', mergedAt: null, closedAt: null, reviewers: [] }],
    '2026-07-08',
    '2026-07-14',
    now,
  );

  assert.equal(stats.health.mergedCount, 0);
  assert.equal(stats.health.mergedDeltaPercent, null);
  assert.equal(stats.health.p50MergeDays, 0);
});
