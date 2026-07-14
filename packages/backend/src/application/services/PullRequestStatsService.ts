import type { GithubPullRequest } from '../../domain/ports/IGithubAdapter';

export type PrAttentionReason = 'stale_no_review' | 'no_review' | 'stale' | 'large';

export interface PrHealthKpis {
  p50MergeDays: number;
  p90MergeDays: number;
  mergedCount: number;
  mergedDeltaPercent: number | null;
  openBacklog: number;
  staleCount: number;
  reviewCoveragePercent: number;
  largePrPercent: number;
}

export interface PrAttentionItem {
  number: number;
  title: string;
  author: string;
  authorAvatarUrl: string;
  daysOpen: number;
  linesChanged: number;
  reviewers: string[];
  reason: PrAttentionReason;
}

export interface AuthorActivityRow {
  login: string;
  avatarUrl: string;
  opened: number;
  merged: number;
  sharePercent: number;
  avgMergeDays: number;
  avgSize: number;
}

export interface ReviewerActivityRow {
  login: string;
  reviewCount: number;
  uniquePrs: number;
}

export interface PrStatsDto {
  period: { from: string; to: string };
  previousPeriod: { from: string; to: string };
  health: PrHealthKpis;
  needsAttention: PrAttentionItem[];
  authorActivity: AuthorActivityRow[];
  reviewerActivity: ReviewerActivityRow[];
}

const MS_PER_DAY = 86_400_000;
const STALE_DAYS = 3;
const LARGE_PR_LINES = 500;

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function linesChanged(pr: GithubPullRequest): number {
  return pr.additions + pr.deletions;
}

function lifetimeDays(pr: GithubPullRequest): number {
  const end = pr.mergedAt ?? pr.closedAt;
  if (!end) return 0;
  return (new Date(end).getTime() - new Date(pr.createdAt).getTime()) / MS_PER_DAY;
}

function daysOpen(pr: GithubPullRequest, now: Date): number {
  return (now.getTime() - new Date(pr.createdAt).getTime()) / MS_PER_DAY;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)]! * 10) / 10;
}

function periodLengthDays(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((end - start) / MS_PER_DAY) + 1;
}

function shiftDate(dateKey: string, deltaDays: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function inRange(iso: string | null, start: number, end: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start && t <= end;
}

function attentionReason(pr: GithubPullRequest, openDays: number): PrAttentionReason | null {
  const hasReview = pr.reviewers.length > 0;
  const isLarge = linesChanged(pr) > LARGE_PR_LINES;
  const isStale = openDays > STALE_DAYS;

  if (isStale && !hasReview) return 'stale_no_review';
  if (!hasReview) return 'no_review';
  if (isStale) return 'stale';
  if (isLarge) return 'large';
  return null;
}

const REASON_PRIORITY: Record<PrAttentionReason, number> = {
  stale_no_review: 0,
  no_review: 1,
  stale: 2,
  large: 3,
};

export function computePrStats(
  pullRequests: GithubPullRequest[],
  dateFrom: string,
  dateTo: string,
  now: Date = new Date(),
): PrStatsDto {
  const periodStart = new Date(`${dateFrom}T00:00:00Z`).getTime();
  const periodEnd = new Date(`${dateTo}T23:59:59.999Z`).getTime();
  const length = periodLengthDays(dateFrom, dateTo);
  const prevFrom = shiftDate(dateFrom, -length);
  const prevTo = shiftDate(dateFrom, -1);
  const prevStart = new Date(`${prevFrom}T00:00:00Z`).getTime();
  const prevEnd = new Date(`${prevTo}T23:59:59.999Z`).getTime();

  const inPeriod = pullRequests.filter(pr => {
    return (
      inRange(pr.createdAt, periodStart, periodEnd) ||
      inRange(pr.mergedAt, periodStart, periodEnd) ||
      inRange(pr.closedAt, periodStart, periodEnd) ||
      pr.state === 'OPEN'
    );
  });

  const mergedInPeriod = inPeriod.filter(pr => inRange(pr.mergedAt, periodStart, periodEnd));
  const mergedInPrevious = pullRequests.filter(pr => inRange(pr.mergedAt, prevStart, prevEnd));
  const openPrs = inPeriod.filter(pr => pr.state === 'OPEN');

  const mergeLifetimes = mergedInPeriod.map(lifetimeDays);
  const withReview = mergedInPeriod.filter(pr => pr.reviewers.length > 0).length;
  const largeMerged = mergedInPeriod.filter(pr => linesChanged(pr) > LARGE_PR_LINES).length;

  const mergedDeltaPercent =
    mergedInPrevious.length === 0
      ? null
      : Math.round(((mergedInPeriod.length - mergedInPrevious.length) / mergedInPrevious.length) * 1000) / 10;

  const needsAttention: PrAttentionItem[] = openPrs
    .map(pr => {
      const openDays = Math.round(daysOpen(pr, now) * 10) / 10;
      const reason = attentionReason(pr, openDays);
      if (!reason) return null;
      return {
        number: pr.number,
        title: pr.title,
        author: pr.authorLogin,
        authorAvatarUrl: pr.authorAvatarUrl,
        daysOpen: openDays,
        linesChanged: linesChanged(pr),
        reviewers: pr.reviewers,
        reason,
      };
    })
    .filter((item): item is PrAttentionItem => item !== null)
    .sort((a, b) => {
      const prio = REASON_PRIORITY[a.reason] - REASON_PRIORITY[b.reason];
      if (prio !== 0) return prio;
      return b.daysOpen - a.daysOpen;
    });

  const staleCount = openPrs.filter(pr => daysOpen(pr, now) > STALE_DAYS).length;

  const authorMap = new Map<string, { avatarUrl: string; opened: number; merged: number; mergeDays: number[]; sizes: number[] }>();
  for (const pr of inPeriod) {
    if (inRange(pr.createdAt, periodStart, periodEnd)) {
      const entry = authorMap.get(pr.authorLogin) ?? { avatarUrl: pr.authorAvatarUrl, opened: 0, merged: 0, mergeDays: [], sizes: [] };
      entry.opened += 1;
      if (pr.authorAvatarUrl) entry.avatarUrl = pr.authorAvatarUrl;
      authorMap.set(pr.authorLogin, entry);
    }
  }
  for (const pr of mergedInPeriod) {
    const entry = authorMap.get(pr.authorLogin) ?? { avatarUrl: pr.authorAvatarUrl, opened: 0, merged: 0, mergeDays: [], sizes: [] };
    entry.merged += 1;
    entry.mergeDays.push(lifetimeDays(pr));
    entry.sizes.push(linesChanged(pr));
    if (pr.authorAvatarUrl) entry.avatarUrl = pr.authorAvatarUrl;
    authorMap.set(pr.authorLogin, entry);
  }

  const totalMerged = mergedInPeriod.length;
  const authorActivity: AuthorActivityRow[] = [...authorMap.entries()]
    .map(([login, data]) => ({
      login,
      avatarUrl: data.avatarUrl,
      opened: data.opened,
      merged: data.merged,
      sharePercent: totalMerged === 0 ? 0 : Math.round((data.merged / totalMerged) * 1000) / 10,
      avgMergeDays:
        data.mergeDays.length === 0
          ? 0
          : Math.round((data.mergeDays.reduce((s, v) => s + v, 0) / data.mergeDays.length) * 10) / 10,
      avgSize:
        data.sizes.length === 0 ? 0 : Math.round(data.sizes.reduce((s, v) => s + v, 0) / data.sizes.length),
    }))
    .sort((a, b) => b.merged - a.merged || b.opened - a.opened);

  const reviewerMap = new Map<string, Set<number>>();
  for (const pr of inPeriod) {
    for (const reviewer of pr.reviewers) {
      if (reviewer === pr.authorLogin) continue;
      const prs = reviewerMap.get(reviewer) ?? new Set<number>();
      prs.add(pr.number);
      reviewerMap.set(reviewer, prs);
    }
  }

  const reviewerActivity: ReviewerActivityRow[] = [...reviewerMap.entries()]
    .map(([login, prs]) => ({
      login,
      reviewCount: prs.size,
      uniquePrs: prs.size,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount);

  return {
    period: { from: dateFrom, to: dateTo },
    previousPeriod: { from: prevFrom, to: prevTo },
    health: {
      p50MergeDays: percentile(mergeLifetimes, 50),
      p90MergeDays: percentile(mergeLifetimes, 90),
      mergedCount: mergedInPeriod.length,
      mergedDeltaPercent,
      openBacklog: openPrs.length,
      staleCount,
      reviewCoveragePercent:
        mergedInPeriod.length === 0 ? 0 : Math.round((withReview / mergedInPeriod.length) * 1000) / 10,
      largePrPercent:
        mergedInPeriod.length === 0 ? 0 : Math.round((largeMerged / mergedInPeriod.length) * 1000) / 10,
    },
    needsAttention,
    authorActivity,
    reviewerActivity,
  };
}

export class PullRequestStatsService {
  constructor(private readonly fetchPullRequests: (owner: string, repo: string, since: string) => Promise<GithubPullRequest[]>) {}

  async getStats(owner: string, repo: string, dateFrom: string, dateTo: string): Promise<PrStatsDto> {
    const length = periodLengthDays(dateFrom, dateTo);
    const since = new Date(`${dateFrom}T00:00:00Z`);
    since.setUTCDate(since.getUTCDate() - length - 7);
    const pullRequests = await this.fetchPullRequests(owner, repo, since.toISOString());
    return computePrStats(pullRequests, dateFrom, dateTo);
  }
}
