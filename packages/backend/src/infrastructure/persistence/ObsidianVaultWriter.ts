import * as fs from 'fs-extra';
import * as path from 'path';

/** Minimalna wersja — pełna implementacja wg `.cursor/PM_SYSTEM_SPEC.md` w kolejnych iteracjach */
export class ObsidianVaultWriter {
  constructor(private readonly dataDir: string) {}

  async initVault(): Promise<void> {
    await fs.ensureDir(path.join(this.dataDir, '.obsidian'));
    await fs.ensureDir(path.join(this.dataDir, '_index'));
    await fs.ensureDir(path.join(this.dataDir, 'templates'));
    await fs.ensureDir(path.join(this.dataDir, 'projects'));
    await fs.ensureDir(path.join(this.dataDir, 'archive'));
  }

  async rebuildTagIndex(_tags: Array<{ tag: { slug: string }; count: number }>): Promise<void> {
    return;
  }

  async rebuildBoardIndex(): Promise<void> {
    return;
  }

  async rebuildAllTasksIndex(): Promise<void> {
    return;
  }

  async rebuildJiraUnlinkedIndex(): Promise<void> {
    return;
  }
}
