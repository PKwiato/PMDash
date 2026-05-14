export interface ClockworkConfig {
  token: string;
  baseUrl?: string;
}

export class ClockworkApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`Clockwork API ${status}: ${message}`);
    this.name = 'ClockworkApiError';
  }
}

export class ClockworkApiClient {
  private readonly headers: Record<string, string>;
  private readonly baseUrl: string;

  constructor(config: ClockworkConfig) {
    const configuredBaseUrl = config.baseUrl?.trim() || 'https://api.clockwork.report/v1';
    this.baseUrl = configuredBaseUrl.replace(/\/$/, '');
    this.headers = {
      Authorization: `Token ${config.token}`,
      Accept: 'application/json',
    };
  }

  async get<T>(path: string, params?: Record<string, string | string[]>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, item);
          }
        } else {
          url.searchParams.set(key, value);
        }
      }
    }

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) {
      const body = await res.text();
      throw new ClockworkApiError(res.status, body);
    }
    return res.json() as Promise<T>;
  }
}
