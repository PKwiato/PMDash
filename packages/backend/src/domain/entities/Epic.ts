import type { Tag } from '../value-objects/Tag';

export class Epic {
  constructor(
    public readonly id: string,
    public title: string,
    public slug: string,
    public projectId: string,
    public status: 'todo' | 'in-progress' | 'done' | 'cancelled',
    public description: string,
    public jiraEpicKey: string | null,
    public jiraEpicId: string | null,
    public dueDate: Date | null,
    public userTags: Tag[],
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  linkJira(epicKey: string, epicId: string): Epic {
    return new Epic(
      this.id,
      this.title,
      this.slug,
      this.projectId,
      this.status,
      this.description,
      epicKey,
      epicId,
      this.dueDate,
      this.userTags,
      this.createdAt,
      new Date(),
    );
  }

  updateStatus(status: Epic['status']): Epic {
    return new Epic(
      this.id,
      this.title,
      this.slug,
      this.projectId,
      status,
      this.description,
      this.jiraEpicKey,
      this.jiraEpicId,
      this.dueDate,
      this.userTags,
      this.createdAt,
      new Date(),
    );
  }
}
