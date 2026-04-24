import type { Tag } from '../value-objects/Tag';

export class Project {
  constructor(
    public readonly id: string,
    public title: string,
    public slug: string,
    public status: 'active' | 'archived',
    public description: string,
    public jiraBoardId: number | null,
    public jiraBoardName: string | null,
    public jiraProjectKey: string | null,
    public userTags: Tag[],
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(params: {
    id: string;
    title: string;
    slug: string;
    status: 'active' | 'archived';
    description: string;
    jiraBoardId: number | null;
    jiraBoardName: string | null;
    jiraProjectKey: string | null;
    userTags: Tag[];
    createdAt: Date;
    updatedAt?: Date;
  }): Project {
    return new Project(
      params.id,
      params.title,
      params.slug,
      params.status,
      params.description,
      params.jiraBoardId,
      params.jiraBoardName,
      params.jiraProjectKey,
      params.userTags,
      params.createdAt,
      params.updatedAt ?? new Date(),
    );
  }

  archive(): Project {
    return new Project(
      this.id,
      this.title,
      this.slug,
      'archived',
      this.description,
      this.jiraBoardId,
      this.jiraBoardName,
      this.jiraProjectKey,
      this.userTags,
      this.createdAt,
      new Date(),
    );
  }

  linkJiraBoard(boardId: number, boardName: string, projectKey: string): Project {
    return new Project(
      this.id,
      this.title,
      this.slug,
      this.status,
      this.description,
      boardId,
      boardName,
      projectKey,
      this.userTags,
      this.createdAt,
      new Date(),
    );
  }
}
