import { EpicNotFoundError } from '../../../domain/errors/EpicNotFoundError';
import {
  EpicProgress,
  type JiraProgressSummary,
} from '../../../domain/value-objects/EpicProgress';
import type { IEpicRepository } from '../../../domain/ports/IEpicRepository';
import type { IJiraAdapter } from '../../../domain/ports/IJiraAdapter';
import type { IProjectRepository } from '../../../domain/ports/IProjectRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';

export class GetEpicProgress {
  constructor(
    private readonly epicRepo: IEpicRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly jiraAdapter: IJiraAdapter | null,
    private readonly defaultBoardId: number,
  ) {}

  async execute(epicId: string): Promise<EpicProgress> {
    const epic = await this.epicRepo.findById(epicId);
    if (!epic) throw new EpicNotFoundError(epicId);

    const tasks = await this.taskRepo.findByEpicId(epicId);
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const todo = tasks.filter(t => t.status === 'todo').length;

    let jiraSummary: JiraProgressSummary | undefined;

    if (epic.jiraEpicKey && this.jiraAdapter) {
      try {
        const project = await this.projectRepo.findById(epic.projectId);
        const boardId =
          project?.jiraBoardId ?? (this.defaultBoardId > 0 ? this.defaultBoardId : null);
        if (boardId != null) {
          const jiraIssues = await this.jiraAdapter.listBoardIssues(boardId);
          const epicIssues = jiraIssues.filter(i => i.epicKey === epic.jiraEpicKey);
          const jiraDone = epicIssues.filter(i => i.status.toLowerCase() === 'done').length;
          jiraSummary = {
            jiraTotal: epicIssues.length,
            jiraDone,
            jiraInProgress: epicIssues.filter(i => i.status.toLowerCase() === 'in progress').length,
            jiraPercentage:
              epicIssues.length === 0 ? 0 : Math.round((jiraDone / epicIssues.length) * 100),
            lastSyncedAt: new Date().toISOString(),
          };
        }
      } catch {
        // Jira unavailable — local only
      }
    }

    return new EpicProgress(tasks.length, done, inProgress, blocked, todo, tasks, jiraSummary);
  }
}
