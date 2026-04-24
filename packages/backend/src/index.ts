import * as fs from 'fs-extra';
import * as path from 'path';
import { ConfigStore } from './infrastructure/config/ConfigStore';
import { ObsidianVaultWriter } from './infrastructure/persistence/ObsidianVaultWriter';
import { createExpressApp } from './infrastructure/presentation/app';

const DATA_DIR = path.resolve(__dirname, '../../..', process.env.PM_DATA_DIR ?? 'data');

async function bootstrap() {
  await fs.ensureDir(DATA_DIR);
  const config = await ConfigStore.load(DATA_DIR);
  const vaultWriter = new ObsidianVaultWriter(DATA_DIR);

  const obsidianDir = path.join(DATA_DIR, '.obsidian');
  const isFirstRun = !(await fs.pathExists(obsidianDir));

  if (isFirstRun) {
    console.log('Initializing Obsidian vault skeleton...');
    await vaultWriter.initVault();
    console.log(`Vault ready. Open "${DATA_DIR}" in Obsidian as a vault.`);
  }

  const app = createExpressApp(config, DATA_DIR);
  const PORT = Number(process.env.PORT ?? 3001);

  app.listen(PORT, () => {
    console.log(`Backend:  http://localhost:${PORT}`);
    console.log(`Data dir: ${DATA_DIR}`);
    if (!config.jira.token) {
      console.warn('Jira not configured. Edit data/config.json');
    }
  });
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
