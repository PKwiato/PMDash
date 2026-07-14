import type { GithubPullRequest, IGithubAdapter } from '../../domain/ports/IGithubAdapter';
import { GithubApiClient } from './GithubApiClient';

const PULL_REQUESTS_QUERY = `
query($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    pullRequests(
      states: [OPEN, MERGED, CLOSED]
      first: 100
      after: $cursor
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        number
        title
        state
        createdAt
        mergedAt
        closedAt
        additions
        deletions
        changedFiles
        author {
          login
          avatarUrl
        }
        reviews(first: 10) {
          nodes {
            author {
              login
            }
            submittedAt
            state
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`;

interface GraphQlPullRequestNode {
  number: number;
  title: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  author: { login: string; avatarUrl: string } | null;
  reviews: {
    nodes: {
      author: { login: string } | null;
      submittedAt: string | null;
      state: string;
    }[];
  };
}

interface GraphQlPullRequestsResponse {
  repository: {
    pullRequests: {
      nodes: GraphQlPullRequestNode[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
}

export class GithubApiAdapter implements IGithubAdapter {
  constructor(private readonly client: GithubApiClient) {}

  async listPullRequests(owner: string, repo: string, since: string): Promise<GithubPullRequest[]> {
    const sinceMs = new Date(since).getTime();
    const results: GithubPullRequest[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const data = await this.client.graphql<GraphQlPullRequestsResponse>(PULL_REQUESTS_QUERY, {
        owner,
        repo,
        cursor,
      });

      const connection = data.repository?.pullRequests;
      if (!connection) break;

      let stopPagination = false;
      for (const node of connection.nodes) {
        const relevantAt = node.mergedAt ?? node.closedAt ?? node.createdAt;
        if (new Date(relevantAt).getTime() < sinceMs) {
          stopPagination = true;
          continue;
        }

        const reviewers = [
          ...new Set(
            node.reviews.nodes
              .filter(r => r.author?.login && r.submittedAt)
              .map(r => r.author!.login),
          ),
        ];

        results.push({
          number: node.number,
          title: node.title,
          state: node.state,
          authorLogin: node.author?.login ?? 'unknown',
          authorAvatarUrl: node.author?.avatarUrl ?? '',
          createdAt: node.createdAt,
          mergedAt: node.mergedAt,
          closedAt: node.closedAt,
          additions: node.additions,
          deletions: node.deletions,
          changedFiles: node.changedFiles,
          reviewers,
        });
      }

      if (stopPagination) break;

      hasNextPage = connection.pageInfo.hasNextPage;
      cursor = connection.pageInfo.endCursor;
    }

    return results;
  }
}
