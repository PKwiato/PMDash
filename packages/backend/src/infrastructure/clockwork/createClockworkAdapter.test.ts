import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppConfig } from '../config/ConfigStore';
import { createClockworkAdapter } from './createClockworkAdapter';

const baseConfig: AppConfig = {
  jira: { baseUrl: '', email: '', token: '', defaultBoardId: 0 },
  clockwork: { baseUrl: 'https://api.clockwork.report/v1', token: '' },
  vault: { productionDir: '', testDir: '', activeMode: 'test' },
};

test('createClockworkAdapter returns null for missing or whitespace token', () => {
  assert.equal(createClockworkAdapter(baseConfig), null);
  assert.equal(
    createClockworkAdapter({
      ...baseConfig,
      clockwork: { ...baseConfig.clockwork, token: '   ' },
    }),
    null,
  );
});

test('createClockworkAdapter trims token before creating adapter', () => {
  const adapter = createClockworkAdapter({
    ...baseConfig,
    clockwork: { ...baseConfig.clockwork, token: '  clockwork-token  ' },
  });

  assert.ok(adapter);
});
