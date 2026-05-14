import type { ClockworkWorklog } from './IJiraAdapter';

export interface IClockworkAdapter {
  listWorklogs(startingAt: string, endingAt: string): Promise<ClockworkWorklog[]>;
}
