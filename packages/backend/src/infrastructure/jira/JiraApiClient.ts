export interface JiraConfig {
  baseUrl: string;
  email: string;
  token: string;
}

export class JiraApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`Jira API ${status}: ${message}`);
    this.name = 'JiraApiError';
  }
}

export class JiraApiClient {
  private readonly headers: Record<string, string>;
  private readonly baseUrl: string;
  private readonly agileBaseUrl: string;

  constructor(config: JiraConfig) {
    const protocolBase = config.baseUrl.startsWith('http') ? config.baseUrl : `https://${config.baseUrl}`;
    this.baseUrl = `${protocolBase.replace(/\/$/, '')}/rest/api/3`;
    this.agileBaseUrl = `${protocolBase.replace(/\/$/, '')}/rest/agile/1.0`;
    const credentials = Buffer.from(`${config.email}:${config.token}`).toString('base64');
    this.headers = {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async get<T>(path: string, params?: Record<string, string>, agile = false): Promise<T> {
    const base = agile ? this.agileBaseUrl : this.baseUrl;
    const url = new URL(`${base}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) {
      const body = await res.text();
      throw new JiraApiError(res.status, body);
    }
    return res.json() as Promise<T>;
  }
}
