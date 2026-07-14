import * as fs from 'fs-extra';
import * as path from 'path';

export interface AppConfig {
  jira: {
    baseUrl: string;
    email: string;
    token: string;
    defaultBoardId: number;
  };
  clockwork: {
    baseUrl: string;
    token: string;
  };
  vault: {
    productionDir: string;
    testDir: string;
    activeMode: 'production' | 'test';
  };
  github: {
    token: string;
    defaultOwner: string;
    defaultRepo: string;
  };
}

const DEFAULT_CLOCKWORK_BASE_URL = 'https://api.clockwork.report/v1';

export class ConfigStore {
  static async load(dataDir: string): Promise<AppConfig> {
    const configPath = path.join(dataDir, 'config.json');

    if (!(await fs.pathExists(configPath))) {
      const defaultConfig: AppConfig = {
        jira: { baseUrl: '', email: '', token: '', defaultBoardId: 0 },
        clockwork: { baseUrl: DEFAULT_CLOCKWORK_BASE_URL, token: '' },
        vault: { 
          productionDir: '', // User will configure this later
          testDir: dataDir,  // Default to existing data folder
          activeMode: 'test'
        },
        github: { token: '', defaultOwner: 'statscore', defaultRepo: 'marketplace' },
      };
      await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
      return defaultConfig;
    }

    const config = await fs.readJSON(configPath);
    
    // Migration/defaults for new fields
    let migrated = false;

    if (!config.vault.testDir) {
      // If we are migrating, keep current dataDir as testDir since that's where the notes are now
      config.vault.testDir = config.vault.dataDir || dataDir;
      config.vault.productionDir = config.vault.productionDir || '';
      config.vault.activeMode = config.vault.activeMode || 'test';
      delete config.vault.dataDir;
      migrated = true;
    }

    if (!config.clockwork) {
      config.clockwork = { baseUrl: DEFAULT_CLOCKWORK_BASE_URL, token: '' };
      migrated = true;
    } else {
      if (!config.clockwork.baseUrl) {
        config.clockwork.baseUrl = DEFAULT_CLOCKWORK_BASE_URL;
        migrated = true;
      }
      if (typeof config.clockwork.token !== 'string') {
        config.clockwork.token = '';
        migrated = true;
      }
    }

    if (!config.github) {
      config.github = { token: '', defaultOwner: 'statscore', defaultRepo: 'marketplace' };
      migrated = true;
    } else {
      if (typeof config.github.token !== 'string') {
        config.github.token = '';
        migrated = true;
      }
      if (!config.github.defaultOwner) {
        config.github.defaultOwner = 'statscore';
        migrated = true;
      }
      if (!config.github.defaultRepo) {
        config.github.defaultRepo = 'marketplace';
        migrated = true;
      }
    }

    if (migrated) {
      await fs.writeJSON(configPath, config, { spaces: 2 });
    }

    return config as AppConfig;
  }

  static async save(dataDir: string, config: AppConfig): Promise<void> {
    const configPath = path.join(dataDir, 'config.json');
    await fs.writeJSON(configPath, config, { spaces: 2 });
  }
}
