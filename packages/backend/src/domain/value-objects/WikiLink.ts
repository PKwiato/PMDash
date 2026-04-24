export class WikiLink {
  private constructor(
    public readonly path: string,
    public readonly displayText: string,
  ) {}

  static create(relativePath: string, displayText: string): WikiLink {
    const cleanPath = relativePath.replace(/\.md$/, '');
    return new WikiLink(cleanPath, displayText);
  }

  toString(): string {
    return `[[${this.path}|${this.displayText}]]`;
  }
}

export class WikiLinkFactory {
  static projectIndex(projectSlug: string, projectTitle: string): WikiLink {
    return WikiLink.create(`projects/${projectSlug}/README`, `Projekt: ${projectTitle}`);
  }

  static epicInProject(projectSlug: string, epicSlug: string, epicTitle: string): WikiLink {
    return WikiLink.create(`projects/${projectSlug}/epics/${epicSlug}`, `Epic: ${epicTitle}`);
  }

  static taskInProject(projectSlug: string, taskSlug: string, taskTitle: string): WikiLink {
    return WikiLink.create(`projects/${projectSlug}/tasks/${taskSlug}`, taskTitle);
  }

  static globalIndex(indexFile: string, label: string): WikiLink {
    return WikiLink.create(`_index/${indexFile}`, label);
  }
}
