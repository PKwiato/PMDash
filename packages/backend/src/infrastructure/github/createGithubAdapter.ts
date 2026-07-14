import type { AppConfig } from '../config/ConfigStore';
import type { IGithubAdapter } from '../../domain/ports/IGithubAdapter';
import { GithubApiAdapter } from './GithubApiAdapter';
import { GithubApiClient } from './GithubApiClient';

export function createGithubAdapter(config: AppConfig): IGithubAdapter | null {
  const token = config.github?.token?.trim();
  if (!token) {
    return null;
  }

  const client = new GithubApiClient({ token });
  return new GithubApiAdapter(client);
}
