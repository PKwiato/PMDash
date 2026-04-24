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
    dataDir: string;
  };
}

export class ConfigStore {
  static async load(dataDir: string): Promise<AppConfig> {
    const configPath = path.join(dataDir, 'config.json');

    if (!(await fs.pathExists(configPath))) {
      const defaultConfig: AppConfig = {
        jira: { baseUrl: '', email: '', token: '', defaultBoardId: 0 },
        vault: { dataDir },
      };
      await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
      return defaultConfig;
    }

    return fs.readJSON(configPath) as Promise<AppConfig>;
  }
}
