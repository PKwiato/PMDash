import * as fs from 'fs-extra';
import * as path from 'path';

export interface AppConfig {
  jira: {
    baseUrl: string;
    email: string;
    token: string;
    defaultBoardId: number;
  };
  vault: {
    productionDir: string;
    testDir: string;
    activeMode: 'production' | 'test';
  };
}

export class ConfigStore {
  static async load(dataDir: string): Promise<AppConfig> {
    const configPath = path.join(dataDir, 'config.json');

    if (!(await fs.pathExists(configPath))) {
      const defaultConfig: AppConfig = {
        jira: { baseUrl: '', email: '', token: '', defaultBoardId: 0 },
        vault: { 
          productionDir: '', // User will configure this later
          testDir: dataDir,  // Default to existing data folder
          activeMode: 'test'
        },
      };
      await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
      return defaultConfig;
    }

    const config = await fs.readJSON(configPath);
    
    // Migration/defaults for new fields
    if (!config.vault.testDir) {
      // If we are migrating, keep current dataDir as testDir since that's where the notes are now
      config.vault.testDir = config.vault.dataDir || dataDir;
      config.vault.productionDir = config.vault.productionDir || '';
      config.vault.activeMode = config.vault.activeMode || 'test';
      delete config.vault.dataDir;
      await fs.writeJSON(configPath, config, { spaces: 2 });
    }

    return config as AppConfig;
  }

  static async save(dataDir: string, config: AppConfig): Promise<void> {
    const configPath = path.join(dataDir, 'config.json');
    await fs.writeJSON(configPath, config, { spaces: 2 });
  }
}
