export interface GithubConfig {
  token: string;
}

export class GithubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`GitHub API ${status}: ${message}`);
    this.name = 'GithubApiError';
  }
}

interface GraphQlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export class GithubApiClient {
  private readonly headers: Record<string, string>;

  constructor(config: GithubConfig) {
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new GithubApiError(res.status, body);
    }

    const payload = (await res.json()) as GraphQlResponse<T>;
    if (payload.errors?.length) {
      throw new GithubApiError(502, payload.errors.map(e => e.message).join('; '));
    }
    if (!payload.data) {
      throw new GithubApiError(502, 'Empty GraphQL response');
    }
    return payload.data;
  }
}
