import type { AppConfig } from '../config/ConfigStore';
import type { IClockworkAdapter } from '../../domain/ports/IClockworkAdapter';
import { ClockworkApiAdapter } from './ClockworkApiAdapter';
import { ClockworkApiClient } from './ClockworkApiClient';

export function createClockworkAdapter(config: AppConfig): IClockworkAdapter | null {
  const token = config.clockwork?.token?.trim();
  if (!token) {
    return null;
  }

  const clockworkClient = new ClockworkApiClient({
    token,
    baseUrl: config.clockwork.baseUrl?.trim(),
  });

  return new ClockworkApiAdapter(clockworkClient);
}
