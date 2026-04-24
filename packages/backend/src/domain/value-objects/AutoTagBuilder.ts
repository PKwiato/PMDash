import type { Epic } from '../entities/Epic';
import type { Project } from '../entities/Project';
import type { Task } from '../entities/Task';
import { Tag } from './Tag';

export class AutoTagBuilder {
  static forProject(project: Project): Tag[] {
    return [
      Tag.of(`project/${project.slug}`),
      Tag.of('type/project'),
      Tag.of(`status/${project.status}`),
      ...(project.jiraBoardId !== null ? [Tag.of('jira/linked')] : []),
      ...project.userTags,
    ];
  }

  static forEpic(epic: Epic, projectSlug: string): Tag[] {
    return [
      Tag.of(`project/${projectSlug}`),
      Tag.of(`epic/${epic.slug}`),
      Tag.of('type/epic'),
      Tag.of(`status/${epic.status}`),
      ...(epic.jiraEpicKey ? [Tag.of('jira/linked')] : []),
      ...epic.userTags,
    ];
  }

  static forTask(task: Task, projectSlug: string, epicSlug: string | null): Tag[] {
    return [
      Tag.of(`project/${projectSlug}`),
      ...(epicSlug ? [Tag.of(`epic/${epicSlug}`)] : []),
      Tag.of('type/task'),
      Tag.of(`status/${task.status}`),
      Tag.of(`priority/${task.priority}`),
      ...(task.jiraIssueKey
        ? [
            Tag.of('jira/linked'),
            Tag.of(`jira/${task.jiraIssueKey.toLowerCase().replace(/-/g, '')}`),
          ]
        : []),
      ...task.userTags,
    ];
  }
}
