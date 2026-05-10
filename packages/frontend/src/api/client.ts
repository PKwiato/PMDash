import axios from 'axios';

function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  return '/api';
}

export const api = axios.create({
  baseURL: resolveApiBase(),
});

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && data !== null) {
      const rec = data as Record<string, unknown>;
      if (typeof rec.error === 'string' && rec.error) return rec.error;
      if (typeof rec.message === 'string' && rec.message) return rec.message;
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
