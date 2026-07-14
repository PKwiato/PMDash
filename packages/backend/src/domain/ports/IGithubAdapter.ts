export type GithubPullRequestState = 'OPEN' | 'MERGED' | 'CLOSED';

export interface GithubPullRequest {
  number: number;
  title: string;
  state: GithubPullRequestState;
  authorLogin: string;
  authorAvatarUrl: string;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  reviewers: string[];
}

export interface IGithubAdapter {
  listPullRequests(owner: string, repo: string, since: string): Promise<GithubPullRequest[]>;
}
