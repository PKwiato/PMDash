# PM System — Pełna Specyfikacja Architektoniczna
> Dokument przeznaczony dla agenta AI do samodzielnej budowy aplikacji.
> Czytaj sekwencyjnie. Każda sekcja zawiera gotowe do implementacji decyzje, struktury i kod.

---

## 1. OVERVIEW

### 1.1 Cel systemu
Lokalny system zarządzania projektami dla jednego użytkownika (single-user, no auth).
- Baza danych = pliki `.md` na lokalnym filesystem z YAML frontmatter
- Frontend = aplikacja Vue 3 (SPA)
- Backend = Node.js REST API
- Integracja z Jira Cloud (Atlassian) przez Personal Access Token
- Vault kompatybilny z Obsidian — pliki `.md` można otwierać i przeglądać w Obsidian

### 1.2 Stack technologiczny
| Warstwa | Technologia |
|---|---|
| Frontend | Vue 3 + Composition API + TypeScript + Pinia + Vue Router + Vite |
| Backend | Node.js + Express + TypeScript |
| Baza danych | Pliki `.md` (YAML frontmatter + Markdown body) |
| Parsowanie .md | `gray-matter` + `js-yaml` |
| Obsidian | Vault z Dataview, Templater, Tag Wrangler |
| Jira | REST API v3 + Basic Auth (email:PAT) |
| Monorepo | pnpm workspaces |
| ID | `uuid` v4 |
| Slug | `slugify` |
| Glob | `fast-glob` |

### 1.3 Środowisko docelowe
- Lokalna maszyna użytkownika (macOS / Linux / Windows)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Katalog danych: konfigurowalny (domyślnie `./data/` w root projektu)
- Uruchomienie: `pnpm dev` — odpala oba procesy równolegle

---

## 2. ARCHITEKTURA — Clean Architecture + Hexagonal (Ports & Adapters)

### 2.1 Zasada nadrzędna
Zależności idą zawsze **do środka**. Domain nie zna Infrastructure. Application nie zna Express. Testy mogą podmieniać dowolny adapter bez zmiany logiki biznesowej.

```
Presentation (HTTP) → Application (Use Cases) → Domain (Entities, Ports)
                                                       ↑
Infrastructure (Repositories, Adapters) ─────────────→┘
```

### 2.2 Warstwy backendu

| Warstwa | Odpowiedzialność |
|---|---|
| `domain/` | Encje, Value Objects, interfejsy Portów (czyste TypeScript, zero zależności zewnętrznych) |
| `application/` | Use Cases — orkiestrują domenę, nie znają HTTP ani filesystem |
| `infrastructure/` | Implementacje portów: MarkdownRepository, JiraApiAdapter, ObsidianVaultWriter |
| `infrastructure/presentation/` | Express controllers, routes, middleware — adapter HTTP (tłumaczą HTTP ↔ Use Cases); fizycznie pod `infrastructure/`, nie jako osobny root `src/presentation/` |

---

## 3. STRUKTURA KATALOGÓW

### 3.1 Root monorepo
```
pmdash/                          ← repo PMDash (nazwa katalogu dowolna)
├── package.json                  ← pnpm workspaces root
├── pnpm-workspace.yaml
├── .gitignore                    ← ignoruje data/config.json, node_modules, dist
├── packages/
│   ├── frontend/                 ← Vue 3 app
│   └── backend/                  ← Node.js API
└── data/                         ← "baza danych" = Obsidian Vault root
    ├── .obsidian/                ← generowany automatycznie
    ├── _index/                   ← dashboardy Dataview
    ├── templates/                ← szablony Obsidian Templater
    ├── projects/
    ├── archive/
    └── config.json               ← GITIGNORE! Jira PAT tutaj
```

### 3.2 Backend — pełna struktura
```
packages/backend/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                                ← bootstrap, startup sequence
    ├── domain/
    │   ├── entities/
    │   │   ├── Project.ts
    │   │   ├── Epic.ts
    │   │   ├── Task.ts
    │   │   └── JiraReference.ts
    │   ├── value-objects/
    │   │   ├── Tag.ts                          ← Tag + TagCategory + AutoTagBuilder
    │   │   ├── WikiLink.ts                     ← WikiLink + WikiLinkFactory
    │   │   ├── ProjectStatus.ts
    │   │   ├── TaskStatus.ts
    │   │   ├── Priority.ts
    │   │   ├── JiraIssueKey.ts                 ← waliduje format "PROJ-123"
    │   │   └── EpicProgress.ts                 ← oblicza % completion
    │   ├── ports/
    │   │   ├── IProjectRepository.ts
    │   │   ├── IEpicRepository.ts
    │   │   ├── ITaskRepository.ts
    │   │   ├── ITagRepository.ts
    │   │   └── IJiraAdapter.ts
    │   └── errors/
    │       ├── ProjectNotFoundError.ts
    │       ├── EpicNotFoundError.ts
    │       ├── TaskNotFoundError.ts
    │       ├── InvalidTagError.ts
    │       └── JiraApiError.ts
    ├── application/
    │   └── use-cases/
    │       ├── projects/
    │       │   ├── CreateProject.ts
    │       │   ├── UpdateProject.ts
    │       │   ├── ArchiveProject.ts
    │       │   ├── RestoreProject.ts
    │       │   ├── GetProject.ts
    │       │   ├── ListProjects.ts
    │       │   └── GetProjectProgress.ts
    │       ├── epics/
    │       │   ├── CreateEpic.ts
    │       │   ├── UpdateEpic.ts
    │       │   ├── GetEpic.ts
    │       │   ├── ListEpics.ts
    │       │   ├── LinkEpicToJira.ts
    │       │   └── GetEpicProgress.ts
    │       ├── tasks/
    │       │   ├── CreateTask.ts
    │       │   ├── UpdateTask.ts
    │       │   ├── GetTask.ts
    │       │   ├── ListTasks.ts
    │       │   ├── LinkTaskToJira.ts
    │       │   └── SyncTaskFromJira.ts
    │       ├── tags/
    │       │   ├── ListTags.ts
    │       │   ├── GetItemsByTag.ts
    │       │   └── ManageEntityTags.ts
    │       └── jira/
    │           ├── ListBoards.ts
    │           ├── ListBoardIssues.ts
    │           ├── ListBoardSprints.ts
    │           ├── GetBoardProgress.ts
    │           └── SyncAllLinkedTasks.ts
    └── infrastructure/
        ├── persistence/
        │   ├── FrontmatterParser.ts            ← gray-matter wrapper, Obsidian-compatible
        │   ├── MarkdownProjectRepository.ts
        │   ├── MarkdownEpicRepository.ts
        │   ├── MarkdownTaskRepository.ts
        │   ├── MarkdownTagRepository.ts
        │   └── ObsidianVaultWriter.ts          ← generuje .obsidian/, _index/, templates/
        ├── jira/
        │   ├── JiraApiClient.ts                ← HTTP client z Basic Auth
        │   ├── JiraApiAdapter.ts               ← implementacja IJiraAdapter
        │   └── JiraResponseMapper.ts           ← Jira DTO → Domain entities
        ├── config/
        │   └── ConfigStore.ts                  ← czyta data/config.json
        └── presentation/
            ├── app.ts                          ← Express app factory
            ├── routes/
            │   ├── projects.routes.ts
            │   ├── epics.routes.ts
            │   ├── tasks.routes.ts
            │   ├── tags.routes.ts
            │   ├── jira.routes.ts
            │   └── vault.routes.ts
            ├── controllers/
            │   ├── ProjectController.ts
            │   ├── EpicController.ts
            │   ├── TaskController.ts
            │   ├── TagController.ts
            │   ├── JiraController.ts
            │   └── VaultController.ts
            └── middleware/
                ├── errorHandler.ts
                └── requestLogger.ts
```

### 3.3 Frontend — pełna struktura
```
packages/frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts
    ├── App.vue
    ├── features/
    │   ├── projects/
    │   │   ├── components/
    │   │   │   ├── ProjectCard.vue
    │   │   │   ├── ProjectForm.vue
    │   │   │   ├── ProjectList.vue
    │   │   │   └── ProjectProgressBar.vue
    │   │   ├── composables/
    │   │   │   ├── useProjects.ts
    │   │   │   └── useProjectForm.ts
    │   │   ├── stores/
    │   │   │   └── projectStore.ts
    │   │   └── views/
    │   │       ├── ProjectsView.vue
    │   │       └── ProjectDetailView.vue
    │   ├── epics/
    │   │   ├── components/
    │   │   │   ├── EpicCard.vue
    │   │   │   ├── EpicForm.vue
    │   │   │   ├── EpicProgress.vue           ← dwa paski: lokalny + Jira
    │   │   │   └── EpicTimeline.vue
    │   │   ├── composables/
    │   │   │   ├── useEpics.ts
    │   │   │   └── useEpicProgress.ts
    │   │   ├── stores/
    │   │   │   └── epicStore.ts
    │   │   └── views/
    │   │       ├── EpicsView.vue
    │   │       └── EpicDetailView.vue
    │   ├── tasks/
    │   │   ├── components/
    │   │   │   ├── TaskCard.vue
    │   │   │   ├── TaskForm.vue
    │   │   │   ├── TaskStatusBadge.vue
    │   │   │   └── JiraLinkBadge.vue
    │   │   ├── composables/
    │   │   │   ├── useTasks.ts
    │   │   │   └── useJiraLink.ts
    │   │   ├── stores/
    │   │   │   └── taskStore.ts
    │   │   └── views/
    │   │       └── TaskDetailView.vue
    │   ├── tags/
    │   │   ├── components/
    │   │   │   ├── TagCloud.vue
    │   │   │   ├── TagBadge.vue
    │   │   │   └── TagFilterPanel.vue
    │   │   ├── composables/
    │   │   │   └── useTags.ts
    │   │   ├── stores/
    │   │   │   └── tagStore.ts
    │   │   └── views/
    │   │       └── TagsView.vue
    │   └── jira/
    │       ├── components/
    │       │   ├── BoardSelector.vue
    │       │   ├── IssueList.vue
    │       │   ├── IssuePicker.vue            ← modal do linkowania
    │       │   ├── BoardProgressChart.vue
    │       │   └── SyncButton.vue
    │       ├── composables/
    │       │   ├── useJiraBoards.ts
    │       │   └── useJiraSync.ts
    │       ├── stores/
    │       │   └── jiraStore.ts
    │       └── views/
    │           ├── JiraBoardView.vue
    │           └── JiraSettingsView.vue
    ├── shared/
    │   ├── components/
    │   │   ├── BaseButton.vue
    │   │   ├── BaseModal.vue
    │   │   ├── BaseInput.vue
    │   │   ├── BaseSelect.vue
    │   │   ├── StatusBadge.vue
    │   │   ├── PriorityBadge.vue
    │   │   ├── EmptyState.vue
    │   │   ├── LoadingSpinner.vue
    │   │   └── ConfirmDialog.vue
    │   ├── composables/
    │   │   ├── useApi.ts                      ← axios instance wrapper
    │   │   └── useNotification.ts
    │   └── types/
    │       ├── project.types.ts
    │       ├── epic.types.ts
    │       ├── task.types.ts
    │       ├── tag.types.ts
    │       └── jira.types.ts
    └── core/
        ├── router/
        │   └── index.ts
        ├── http/
        │   └── apiClient.ts                   ← axios z baseURL=localhost:3001
        └── config/
            └── env.ts
```

### 3.4 Struktura Obsidian Vault (`data/`)
```
data/
├── .obsidian/                                 ← generowany przez ObsidianVaultWriter
│   ├── app.json
│   ├── appearance.json                        ← włącza pm-system.css snippet
│   ├── community-plugins.json                 ← [dataview, templater-obsidian, tag-wrangler, obsidian-projects]
│   └── plugins/
│       └── dataview/
│           └── data.json
│   └── snippets/
│       └── pm-system.css                      ← kolory tagów statusów i priorytetów
├── _index/                                    ← generowane automatycznie, nie edytuj ręcznie
│   ├── tags.md                                ← Dataview: tagi z licznikami
│   ├── board.md                               ← DataviewJS: kanban view
│   ├── all-tasks.md                           ← Dataview: tabela wszystkich aktywnych tasków
│   └── jira-unlinked.md                       ← Dataview: taski bez Jira issue
├── templates/                                 ← szablony Templater (do ręcznych notatek)
│   ├── project.md
│   ├── epic.md
│   └── task.md
├── projects/
│   └── {project-slug}/
│       ├── README.md                          ← metadane projektu
│       ├── epics/
│       │   └── {epic-slug}.md
│       ├── tasks/
│       │   └── {task-slug}.md
│       └── notes/
│           └── {note-slug}.md              ← notatki projektowe (type: note)
├── archive/
│   └── {project-slug}/                        ← archiwizacja = przeniesienie folderu
└── config.json                                ← GITIGNORE! Jira PAT
```

---

## 4. MODELE DANYCH — format plików `.md`

### 4.1 Projekt — `projects/{slug}/README.md`
```markdown
---
id: "uuid-v4"
type: project
title: "Nazwa projektu"
slug: "nazwa-projektu"
status: active
description: "Opis projektu"
jira_board_id: 42
jira_board_name: "Board Name"
jira_project_key: "PROJ"
created_at: "2025-01-10T09:00:00Z"
updated_at: "2025-04-20T14:30:00Z"
tags:
  - type/project
  - status/active
  - jira/linked
  - area/backend
aliases:
  - "Nazwa projektu"
cssclasses:
  - pm-project
---

## Opis projektu

Pełny opis, cele, stakeholderzy...

## Powiązane

- [[_index/all-tasks|Wszystkie taski]]
```

### 4.2 Epic — `projects/{slug}/epics/{epic-slug}.md`
```markdown
---
id: "uuid-v4"
type: epic
title: "Nazwa epica"
slug: "nazwa-epica"
project_id: "uuid-projektu"
status: in-progress
jira_epic_key: "PROJ-50"
jira_epic_id: "10050"
due_date: "2025-06-30"
created_at: "2025-01-12T10:00:00Z"
updated_at: "2025-04-18T16:00:00Z"
tags:
  - project/{project-slug}
  - epic/{epic-slug}
  - type/epic
  - status/in-progress
  - jira/linked
aliases:
  - "PROJ-50"
  - "nazwa epica"
cssclasses:
  - pm-epic
---

## Opis

Opis epica...

## Kryteria akceptacji

- [ ] Kryterium 1
- [ ] Kryterium 2

## Powiązane

- [[projects/{project-slug}/README|Projekt: Nazwa projektu]]
```

### 4.3 Task — `projects/{slug}/tasks/{task-slug}.md`
```markdown
---
id: "uuid-v4"
type: task
title: "Nazwa taska"
slug: "nazwa-taska"
project_id: "uuid-projektu"
epic_id: "uuid-epica"
status: in-progress
priority: high
jira_issue_key: "PROJ-123"
jira_issue_id: "10123"
jira_status: "In Progress"
jira_assignee: "Jan Kowalski"
jira_synced_at: "2025-04-23T08:00:00Z"
estimated_hours: 8
created_at: "2025-01-15T10:00:00Z"
updated_at: "2025-04-22T09:30:00Z"
tags:
  - project/{project-slug}
  - epic/{epic-slug}
  - type/task
  - status/in-progress
  - priority/high
  - jira/linked
aliases:
  - "PROJ-123"
  - "nazwa taska"
cssclasses:
  - pm-task
---

## Opis

Treść taska...

## Powiązane

- [[projects/{project-slug}/README|Projekt: Nazwa projektu]]
- [[projects/{project-slug}/epics/{epic-slug}|Epic: Nazwa epica]]
```

### 4.4 Notatka — `projects/{slug}/notes/{note-slug}.md`

Dowolna treść Markdown w ciele; API zapisuje frontmatter + body (jak taski).

```markdown
---
id: "uuid-v4"
type: note
title: "Tytuł notatki"
slug: "tytul-notatki"
project_id: "uuid-projektu"
created_at: "2025-04-24T10:00:00Z"
updated_at: "2025-04-24T12:00:00Z"
tags:
  - project/{project-slug}
  - type/note
aliases:
  - "Tytuł notatki"
cssclasses:
  - pm-note
---

## Treść

…markdown użytkownika…
```

### 4.5 Dozwolone wartości pól
```
status (Project):  active | archived
status (Epic):     todo | in-progress | done | cancelled
status (Task):     todo | in-progress | review | blocked | done
priority (Task):   low | medium | high | critical
type:              project | epic | task | note | index
```

### 4.6 `data/config.json` (GITIGNORE!)
```json
{
  "jira": {
    "baseUrl": "https://twoja-firma.atlassian.net",
    "email": "jan@firma.pl",
    "token": "ATATT3xFfG...",
    "defaultBoardId": 42
  },
  "vault": {
    "dataDir": "./data"
  }
}
```

---

## 5. DOMAIN LAYER — pełny kod

### 5.1 Value Object: Tag
```typescript
// domain/value-objects/Tag.ts
export enum TagCategory {
  PROJECT = 'project',
  EPIC = 'epic',
  STATUS = 'status',
  PRIORITY = 'priority',
  TYPE = 'type',
  JIRA = 'jira',
  AREA = 'area',
  SPRINT = 'sprint',
  CUSTOM = 'custom',
}

export class Tag {
  readonly slug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly parent: string | null;

  private constructor(slug: string) {
    this.slug = slug;
    const parts = slug.split('/');
    this.category = this.resolveCategory(parts[0]);
    this.parent = parts.length > 1 ? parts[0] : null;
    this.label = parts[parts.length - 1].replace(/-/g, ' ');
  }

  static of(slug: string): Tag {
    if (!Tag.isValid(slug)) throw new InvalidTagError(slug);
    return new Tag(slug.toLowerCase().trim());
  }

  static isValid(slug: string): boolean {
    return /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(slug);
  }

  private resolveCategory(prefix: string): TagCategory {
    return (Object.values(TagCategory) as string[]).includes(prefix)
      ? prefix as TagCategory
      : TagCategory.CUSTOM;
  }

  equals(other: Tag): boolean {
    return this.slug === other.slug;
  }

  toString(): string {
    return this.slug;
  }
}

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
        ? [Tag.of('jira/linked'), Tag.of(`jira/${task.jiraIssueKey.toLowerCase().replace('-', '')}`)]
        : []),
      ...task.userTags,
    ];
  }
}
```

### 5.2 Value Object: WikiLink
```typescript
// domain/value-objects/WikiLink.ts
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
```

### 5.3 Value Object: EpicProgress
```typescript
// domain/value-objects/EpicProgress.ts
export interface JiraProgressSummary {
  jiraTotal: number;
  jiraDone: number;
  jiraInProgress: number;
  jiraPercentage: number;
  lastSyncedAt: string;
}

export class EpicProgress {
  readonly percentage: number;
  readonly jiraLinkedCount: number;

  constructor(
    public readonly total: number,
    public readonly done: number,
    public readonly inProgress: number,
    public readonly blocked: number,
    public readonly todo: number,
    tasks: Task[],
    public readonly jiraProgressSummary?: JiraProgressSummary,
  ) {
    this.percentage = total === 0 ? 0 : Math.round((done / total) * 100);
    this.jiraLinkedCount = tasks.filter(t => t.jiraIssueKey !== null).length;
  }
}
```

### 5.4 Entity: Project
```typescript
// domain/entities/Project.ts
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

  /** Pola konstruktora bez metod instancji — poprawny typ dla fabryki w TS */
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
      params.id, params.title, params.slug, params.status,
      params.description, params.jiraBoardId, params.jiraBoardName,
      params.jiraProjectKey, params.userTags, params.createdAt,
      params.updatedAt ?? new Date(),
    );
  }

  archive(): Project {
    return new Project(this.id, this.title, this.slug, 'archived',
      this.description, this.jiraBoardId, this.jiraBoardName,
      this.jiraProjectKey, this.userTags, this.createdAt, new Date());
  }

  linkJiraBoard(boardId: number, boardName: string, projectKey: string): Project {
    return new Project(this.id, this.title, this.slug, this.status,
      this.description, boardId, boardName, projectKey,
      this.userTags, this.createdAt, new Date());
  }
}
```

### 5.5 Entity: Epic
```typescript
// domain/entities/Epic.ts
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
    return new Epic(this.id, this.title, this.slug, this.projectId,
      this.status, this.description, epicKey, epicId,
      this.dueDate, this.userTags, this.createdAt, new Date());
  }

  updateStatus(status: Epic['status']): Epic {
    return new Epic(this.id, this.title, this.slug, this.projectId,
      status, this.description, this.jiraEpicKey, this.jiraEpicId,
      this.dueDate, this.userTags, this.createdAt, new Date());
  }
}
```

### 5.6 Entity: Task
```typescript
// domain/entities/Task.ts
export class Task {
  constructor(
    public readonly id: string,
    public title: string,
    public slug: string,
    public projectId: string,
    public epicId: string | null,
    public status: 'todo' | 'in-progress' | 'review' | 'blocked' | 'done',
    public priority: 'low' | 'medium' | 'high' | 'critical',
    public description: string,
    public jiraIssueKey: string | null,
    public jiraIssueId: string | null,
    public jiraStatus: string | null,
    public jiraAssignee: string | null,
    public jiraSyncedAt: Date | null,
    public estimatedHours: number,
    public userTags: Tag[],
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  linkJira(issueKey: string, issueId: string, jiraStatus: string, assignee: string | null): Task {
    return new Task(this.id, this.title, this.slug, this.projectId,
      this.epicId, this.status, this.priority, this.description,
      issueKey, issueId, jiraStatus, assignee, new Date(),
      this.estimatedHours, this.userTags, this.createdAt, new Date());
  }

  syncFromJira(jiraStatus: string, assignee: string | null): Task {
    return new Task(this.id, this.title, this.slug, this.projectId,
      this.epicId, this.status, this.priority, this.description,
      this.jiraIssueKey, this.jiraIssueId, jiraStatus, assignee, new Date(),
      this.estimatedHours, this.userTags, this.createdAt, new Date());
  }
}
```

### 5.7 Ports (interfejsy)
```typescript
// domain/ports/IProjectRepository.ts
export interface IProjectRepository {
  findAll(): Promise<Project[]>;
  findAllArchived(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  findBySlug(slug: string): Promise<Project | null>;
  save(project: Project, tags: Tag[], links: WikiLink[], aliases: string[]): Promise<void>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}

// domain/ports/IEpicRepository.ts
export interface IEpicRepository {
  findByProjectId(projectId: string): Promise<Epic[]>;
  findById(id: string): Promise<Epic | null>;
  save(epic: Epic, tags: Tag[], links: WikiLink[], aliases: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}

// domain/ports/ITaskRepository.ts
export interface ITaskRepository {
  findByProjectId(projectId: string): Promise<Task[]>;
  findByEpicId(epicId: string): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  findAllLinkedToJira(): Promise<Task[]>;
  save(task: Task, tags: Tag[], links: WikiLink[], aliases: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}

// domain/ports/ITagRepository.ts
export interface TagWithCount { tag: Tag; count: number; }
export interface TaggedItems { projects: Project[]; epics: Epic[]; tasks: Task[]; }

export interface ITagRepository {
  findAll(): Promise<TagWithCount[]>;
  findByTag(tagSlug: string): Promise<TaggedItems>;
}

// domain/ports/IJiraAdapter.ts
export interface JiraBoard { id: number; name: string; projectKey: string; type: string; }
export interface JiraIssue { id: string; key: string; summary: string; status: string; assignee: string | null; priority: string; issueType: string; epicKey: string | null; }
export interface JiraSprint { id: number; name: string; state: string; startDate: string; endDate: string; }
export interface JiraBoardProgress { total: number; byStatus: Record<string, number>; }

export interface IJiraAdapter {
  listBoards(): Promise<JiraBoard[]>;
  listBoardIssues(boardId: number, sprintId?: number): Promise<JiraIssue[]>;
  listBoardSprints(boardId: number): Promise<JiraSprint[]>;
  getIssue(issueKey: string): Promise<JiraIssue>;
  getBoardProgress(projectKey: string): Promise<JiraBoardProgress>;
}
```

---

## 6. APPLICATION LAYER — Use Cases

### 6.1 CreateProject
```typescript
// application/use-cases/projects/CreateProject.ts
export interface CreateProjectDTO {
  title: string;
  description?: string;
  tags?: string[];
}

export class CreateProject {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async execute(dto: CreateProjectDTO): Promise<Project> {
    const slug = slugify(dto.title, { lower: true, strict: true });
    const existing = await this.projectRepo.findBySlug(slug);
    if (existing) throw new Error(`Project with slug "${slug}" already exists`);

    const project = new Project(
      uuid(), dto.title, slug, 'active',
      dto.description ?? '', null, null, null,
      (dto.tags ?? []).map(t => Tag.of(t)),
      new Date(), new Date(),
    );

    const tags = AutoTagBuilder.forProject(project);
    const links = [WikiLinkFactory.globalIndex('all-tasks', 'Wszystkie taski')];
    const aliases = [project.title, slug.replace(/-/g, ' ')];

    await this.projectRepo.save(project, tags, links, aliases);
    return project;
  }
}
```

### 6.2 ArchiveProject
```typescript
// application/use-cases/projects/ArchiveProject.ts
export class ArchiveProject {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async execute(projectId: string): Promise<void> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new ProjectNotFoundError(projectId);
    if (project.status === 'archived') throw new Error('Project is already archived');
    await this.projectRepo.archive(projectId);
  }
}
```

### 6.3 GetEpicProgress
```typescript
// application/use-cases/epics/GetEpicProgress.ts
export class GetEpicProgress {
  constructor(
    private readonly epicRepo: IEpicRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly jiraAdapter: IJiraAdapter | null,
    /** Z config.json — używane gdy projekt nie ma jira_board_id */
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
          project?.jiraBoardId ??
          (this.defaultBoardId > 0 ? this.defaultBoardId : null);
        if (boardId == null) {
          // Brak boardu — tylko lokalny postęp
        } else {
          const jiraIssues = await this.jiraAdapter.listBoardIssues(boardId);
          const epicIssues = jiraIssues.filter(i => i.epicKey === epic.jiraEpicKey);
          const jiraDone = epicIssues.filter(i => i.status.toLowerCase() === 'done').length;
          jiraSummary = {
            jiraTotal: epicIssues.length,
            jiraDone,
            jiraInProgress: epicIssues.filter(i => i.status.toLowerCase() === 'in progress').length,
            jiraPercentage: epicIssues.length === 0 ? 0 : Math.round((jiraDone / epicIssues.length) * 100),
            lastSyncedAt: new Date().toISOString(),
          };
        }
      } catch {
        // Jira niedostępna — zwracamy tylko lokalne dane
      }
    }

    return new EpicProgress(tasks.length, done, inProgress, blocked, todo, tasks, jiraSummary);
  }
}
```

### 6.4 LinkTaskToJira
```typescript
// application/use-cases/tasks/LinkTaskToJira.ts
export interface LinkTaskToJiraDTO {
  taskId: string;
  jiraIssueKey: string;
}

export class LinkTaskToJira {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly epicRepo: IEpicRepository,
    private readonly jiraAdapter: IJiraAdapter,
  ) {}

  async execute(dto: LinkTaskToJiraDTO): Promise<Task> {
    if (!/^[A-Z]+-\d+$/.test(dto.jiraIssueKey)) {
      throw new Error(`Invalid Jira issue key format: "${dto.jiraIssueKey}"`);
    }

    const task = await this.taskRepo.findById(dto.taskId);
    if (!task) throw new TaskNotFoundError(dto.taskId);

    const project = await this.projectRepo.findById(task.projectId);
    if (!project) throw new ProjectNotFoundError(task.projectId);

    const epic = task.epicId ? await this.epicRepo.findById(task.epicId) : null;
    const jiraIssue = await this.jiraAdapter.getIssue(dto.jiraIssueKey);

    const updatedTask = task.linkJira(
      jiraIssue.key, jiraIssue.id, jiraIssue.status, jiraIssue.assignee,
    );

    const tags = AutoTagBuilder.forTask(updatedTask, project.slug, epic?.slug ?? null);
    const links: WikiLink[] = [
      WikiLinkFactory.projectIndex(project.slug, project.title),
      ...(epic ? [WikiLinkFactory.epicInProject(project.slug, epic.slug, epic.title)] : []),
    ];
    const aliases = [dto.jiraIssueKey, task.title];

    await this.taskRepo.save(updatedTask, tags, links, aliases);
    return updatedTask;
  }
}
```

### 6.5 SyncAllLinkedTasks
```typescript
// application/use-cases/jira/SyncAllLinkedTasks.ts
export interface SyncResult { synced: number; failed: number; errors: string[]; }

export class SyncAllLinkedTasks {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly epicRepo: IEpicRepository,
    private readonly jiraAdapter: IJiraAdapter,
  ) {}

  async execute(): Promise<SyncResult> {
    const linkedTasks = await this.taskRepo.findAllLinkedToJira();
    const result: SyncResult = { synced: 0, failed: 0, errors: [] };

    for (const task of linkedTasks) {
      try {
        const jiraIssue = await this.jiraAdapter.getIssue(task.jiraIssueKey!);
        const updated = task.syncFromJira(jiraIssue.status, jiraIssue.assignee);

        const project = await this.projectRepo.findById(task.projectId);
        const epic = task.epicId ? await this.epicRepo.findById(task.epicId) : null;
        const tags = AutoTagBuilder.forTask(updated, project!.slug, epic?.slug ?? null);
        const links: WikiLink[] = [
          WikiLinkFactory.projectIndex(project!.slug, project!.title),
        ];

        await this.taskRepo.save(updated, tags, links, [task.jiraIssueKey!, task.title]);
        result.synced++;
      } catch (err) {
        result.failed++;
        result.errors.push(`${task.jiraIssueKey}: ${(err as Error).message}`);
      }
    }

    return result;
  }
}
```

---

## 7. INFRASTRUCTURE LAYER

### 7.1 FrontmatterParser
```typescript
// infrastructure/persistence/FrontmatterParser.ts
import matter from 'gray-matter';
import * as yaml from 'js-yaml';
import * as fs from 'fs-extra';

export class FrontmatterParser {
  async parseFile(filePath: string): Promise<Record<string, unknown>> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(raw);
    return data;
  }

  async parseFileWithBody(filePath: string): Promise<{ data: Record<string, unknown>; content: string }> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return { data, content };
  }

  // WAŻNE: nadpisuje tylko frontmatter — ciało Markdown zostaje nienaruszone
  async updateFrontmatterOnly(
    filePath: string,
    newFrontmatter: Record<string, unknown>,
  ): Promise<void> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { content } = matter(raw);
    const newYaml = yaml.dump(newFrontmatter, { lineWidth: -1, quotingType: '"', forceQuotes: false });
    const updated = `---\n${newYaml}\n---\n${content}`;
    await fs.writeFile(filePath, updated, 'utf-8');
  }

  // Serializuje pełny plik z body
  serialize(frontmatter: Record<string, unknown>, body: string): string {
    const yamlStr = yaml.dump(frontmatter, { lineWidth: -1, quotingType: '"' });
    return `---\n${yamlStr}\n---\n\n${body.trim()}\n`;
  }

  parseTags(data: Record<string, unknown>): Tag[] {
    const raw = data['tags'];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t): t is string => typeof t === 'string')
      .filter(t => Tag.isValid(t))
      .map(t => Tag.of(t));
  }

  parseAliases(data: Record<string, unknown>): string[] {
    const raw = data['aliases'];
    if (!Array.isArray(raw)) return [];
    return raw.filter((a): a is string => typeof a === 'string');
  }

  buildFrontmatter(
    entity: Record<string, unknown>,
    tags: Tag[],
    aliases: string[],
    cssClass: string,
  ): Record<string, unknown> {
    return {
      ...entity,
      tags: tags.map(t => t.slug),
      aliases,
      cssclasses: [cssClass],
    };
  }
}
```

### 7.2 MarkdownProjectRepository
```typescript
// infrastructure/persistence/MarkdownProjectRepository.ts
import * as fs from 'fs-extra';
import * as path from 'path';

export class MarkdownProjectRepository implements IProjectRepository {
  constructor(
    private readonly dataDir: string,
    private readonly parser: FrontmatterParser,
  ) {}

  private projectDir(slug: string): string {
    return path.join(this.dataDir, 'projects', slug);
  }

  private projectFile(slug: string): string {
    return path.join(this.projectDir(slug), 'README.md');
  }

  private archiveDir(slug: string): string {
    return path.join(this.dataDir, 'archive', slug);
  }

  async findAll(): Promise<Project[]> {
    const projectsRoot = path.join(this.dataDir, 'projects');
    await fs.ensureDir(projectsRoot);
    const dirs = await fs.readdir(projectsRoot);
    const projects: Project[] = [];

    for (const dir of dirs) {
      const readmePath = path.join(projectsRoot, dir, 'README.md');
      if (!await fs.pathExists(readmePath)) continue;
      try {
        const data = await this.parser.parseFile(readmePath);
        if (data.type === 'project') projects.push(this.toEntity(data));
      } catch { /* skip malformed files */ }
    }

    return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findAllArchived(): Promise<Project[]> {
    const archiveRoot = path.join(this.dataDir, 'archive');
    await fs.ensureDir(archiveRoot);
    const dirs = await fs.readdir(archiveRoot);
    const projects: Project[] = [];

    for (const dir of dirs) {
      const readmePath = path.join(archiveRoot, dir, 'README.md');
      if (!await fs.pathExists(readmePath)) continue;
      try {
        const data = await this.parser.parseFile(readmePath);
        projects.push(this.toEntity(data));
      } catch { /* skip */ }
    }

    return projects;
  }

  async findById(id: string): Promise<Project | null> {
    const all = await this.findAll();
    return all.find(p => p.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const filePath = this.projectFile(slug);
    if (!await fs.pathExists(filePath)) return null;
    const data = await this.parser.parseFile(filePath);
    return this.toEntity(data);
  }

  async save(project: Project, tags: Tag[], links: WikiLink[], aliases: string[]): Promise<void> {
    const dir = this.projectDir(project.slug);
    await fs.ensureDir(dir);
    await fs.ensureDir(path.join(dir, 'epics'));
    await fs.ensureDir(path.join(dir, 'tasks'));

    const filePath = this.projectFile(project.slug);
    const frontmatter = this.parser.buildFrontmatter(
      {
        id: project.id, type: 'project', title: project.title,
        slug: project.slug, status: project.status,
        description: project.description,
        jira_board_id: project.jiraBoardId,
        jira_board_name: project.jiraBoardName,
        jira_project_key: project.jiraProjectKey,
        created_at: project.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      tags, aliases, 'pm-project',
    );

    const existingBody = await fs.pathExists(filePath)
      ? (await this.parser.parseFileWithBody(filePath)).content
      : `## Opis projektu\n\n${project.description}\n\n## Powiązane\n\n${links.map(l => `- ${l}`).join('\n')}\n`;

    await fs.writeFile(filePath, this.parser.serialize(frontmatter, existingBody), 'utf-8');
  }

  async archive(id: string): Promise<void> {
    const project = await this.findById(id);
    if (!project) throw new ProjectNotFoundError(id);

    const src = this.projectDir(project.slug);
    const dest = this.archiveDir(project.slug);
    await fs.move(src, dest, { overwrite: false });

    // Zaktualizuj status w zarchiwizowanym pliku
    const archivedFile = path.join(dest, 'README.md');
    const data = await this.parser.parseFile(archivedFile);
    await this.parser.updateFrontmatterOnly(archivedFile, { ...data, status: 'archived', updated_at: new Date().toISOString() });
  }

  async restore(id: string): Promise<void> {
    const archiveRoot = path.join(this.dataDir, 'archive');
    const dirs = await fs.readdir(archiveRoot);

    for (const dir of dirs) {
      const readmePath = path.join(archiveRoot, dir, 'README.md');
      if (!await fs.pathExists(readmePath)) continue;
      const data = await this.parser.parseFile(readmePath);
      if (data.id === id) {
        const src = path.join(archiveRoot, dir);
        const dest = this.projectDir(dir);
        await fs.move(src, dest);
        await this.parser.updateFrontmatterOnly(path.join(dest, 'README.md'), { ...data, status: 'active', updated_at: new Date().toISOString() });
        return;
      }
    }

    throw new ProjectNotFoundError(id);
  }

  private toEntity(data: Record<string, unknown>): Project {
    return new Project(
      data.id as string,
      data.title as string,
      data.slug as string,
      (data.status as 'active' | 'archived') ?? 'active',
      (data.description as string) ?? '',
      data.jira_board_id as number | null ?? null,
      data.jira_board_name as string | null ?? null,
      data.jira_project_key as string | null ?? null,
      this.parser.parseTags(data).filter(t => t.category === TagCategory.CUSTOM),
      new Date(data.created_at as string),
      new Date(data.updated_at as string),
    );
  }
}
```

### 7.3 JiraApiClient
```typescript
// infrastructure/jira/JiraApiClient.ts
export interface JiraConfig {
  baseUrl: string;
  email: string;
  token: string;
}

export class JiraApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(`Jira API ${status}: ${message}`);
  }
}

export class JiraApiClient {
  private readonly headers: Record<string, string>;
  private readonly baseUrl: string;
  private readonly agileBaseUrl: string;

  constructor(config: JiraConfig) {
    this.baseUrl = `${config.baseUrl}/rest/api/3`;
    this.agileBaseUrl = `${config.baseUrl}/rest/agile/1.0`;
    const credentials = Buffer.from(`${config.email}:${config.token}`).toString('base64');
    this.headers = {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async get<T>(path: string, params?: Record<string, string>, agile = false): Promise<T> {
    const base = agile ? this.agileBaseUrl : this.baseUrl;
    const url = new URL(`${base}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) {
      const body = await res.text();
      throw new JiraApiError(res.status, body);
    }
    return res.json();
  }
}
```

### 7.4 JiraApiAdapter
```typescript
// infrastructure/jira/JiraApiAdapter.ts
export class JiraApiAdapter implements IJiraAdapter {
  constructor(private readonly client: JiraApiClient) {}

  async listBoards(): Promise<JiraBoard[]> {
    const data = await this.client.get<{ values: any[] }>('/board', {}, true);
    return data.values.map(b => ({
      id: b.id, name: b.name,
      projectKey: b.location?.projectKey ?? '',
      type: b.type,
    }));
  }

  async listBoardIssues(boardId: number, sprintId?: number): Promise<JiraIssue[]> {
    const path = sprintId
      ? `/board/${boardId}/sprint/${sprintId}/issue`
      : `/board/${boardId}/issue`;
    const data = await this.client.get<{ issues: any[] }>(path, {
      fields: 'summary,status,assignee,priority,parent,issuetype,customfield_10014',
      maxResults: '200',
    }, true);
    return data.issues.map(JiraResponseMapper.toIssue);
  }

  async listBoardSprints(boardId: number): Promise<JiraSprint[]> {
    const data = await this.client.get<{ values: any[] }>(
      `/board/${boardId}/sprint`, { state: 'active,future' }, true,
    );
    return data.values.map(s => ({
      id: s.id, name: s.name, state: s.state,
      startDate: s.startDate ?? '', endDate: s.endDate ?? '',
    }));
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    const data = await this.client.get<any>(`/issue/${issueKey}`, {
      fields: 'summary,status,assignee,priority,parent,issuetype,customfield_10014',
    });
    return JiraResponseMapper.toIssue(data);
  }

  async getBoardProgress(projectKey: string): Promise<JiraBoardProgress> {
    const jql = `project = "${projectKey}" ORDER BY status`;
    const data = await this.client.get<{ issues: any[] }>('/search', {
      jql,
      fields: 'status',
      maxResults: '500',
    });
    const byStatus: Record<string, number> = {};
    for (const issue of data.issues) {
      const status: string = issue.fields.status.name;
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }
    return { total: data.issues.length, byStatus };
  }
}

// infrastructure/jira/JiraResponseMapper.ts
export class JiraResponseMapper {
  static toIssue(raw: any): JiraIssue {
    return {
      id: raw.id,
      key: raw.key,
      summary: raw.fields.summary,
      status: raw.fields.status.name,
      assignee: raw.fields.assignee?.displayName ?? null,
      priority: raw.fields.priority?.name ?? 'Medium',
      issueType: raw.fields.issuetype.name,
      epicKey: raw.fields.customfield_10014 ?? raw.fields.parent?.key ?? null,
    };
  }
}
```

### 7.5 ObsidianVaultWriter
```typescript
// infrastructure/persistence/ObsidianVaultWriter.ts
import * as fs from 'fs-extra';
import * as path from 'path';

export class ObsidianVaultWriter {
  constructor(private readonly dataDir: string) {}

  async initVault(): Promise<void> {
    const obsidianDir = path.join(this.dataDir, '.obsidian');
    await fs.ensureDir(obsidianDir);
    await fs.ensureDir(path.join(obsidianDir, 'snippets'));
    await fs.ensureDir(path.join(obsidianDir, 'plugins', 'dataview'));
    await fs.ensureDir(path.join(this.dataDir, '_index'));
    await fs.ensureDir(path.join(this.dataDir, 'templates'));
    await fs.ensureDir(path.join(this.dataDir, 'projects'));
    await fs.ensureDir(path.join(this.dataDir, 'archive'));

    await Promise.all([
      this.writeAppJson(),
      this.writeAppearanceJson(),
      this.writeCommunityPlugins(),
      this.writeDataviewConfig(),
      this.writeCssSnippet(),
      this.writeTemplates(),
      this.rebuildTagIndex([]),
      this.rebuildBoardIndex(),
      this.rebuildAllTasksIndex(),
      this.rebuildJiraUnlinkedIndex(),
    ]);
  }

  private async writeAppJson(): Promise<void> {
    await fs.writeJSON(path.join(this.dataDir, '.obsidian', 'app.json'), {
      useMarkdownLinks: false,
      newFileLocation: 'current',
      attachmentFolderPath: '_assets',
      showLineNumber: true,
      readableLineLength: true,
      strictLineBreaks: false,
      foldHeading: true,
    }, { spaces: 2 });
  }

  private async writeAppearanceJson(): Promise<void> {
    await fs.writeJSON(path.join(this.dataDir, '.obsidian', 'appearance.json'), {
      enabledCssSnippets: ['pm-system'],
    }, { spaces: 2 });
  }

  private async writeCommunityPlugins(): Promise<void> {
    await fs.writeJSON(
      path.join(this.dataDir, '.obsidian', 'community-plugins.json'),
      ['dataview', 'templater-obsidian', 'tag-wrangler', 'obsidian-projects'],
      { spaces: 2 },
    );
  }

  private async writeDataviewConfig(): Promise<void> {
    await fs.writeJSON(
      path.join(this.dataDir, '.obsidian', 'plugins', 'dataview', 'data.json'),
      {
        enableDataviewJs: true,
        enableInlineDataview: true,
        enableInlineDataviewJs: false,
        prettyRenderInlineFields: true,
      },
      { spaces: 2 },
    );
  }

  private async writeCssSnippet(): Promise<void> {
    const css = `/* PM System — visual tag styling */
a.tag[href="#status/done"]        { background: #EAF3DE; color: #3B6D11; border-radius: 4px; }
a.tag[href="#status/in-progress"] { background: #FAEEDA; color: #854F0B; border-radius: 4px; }
a.tag[href="#status/blocked"]     { background: #FCEBEB; color: #A32D2D; border-radius: 4px; }
a.tag[href="#status/review"]      { background: #E6F1FB; color: #185FA5; border-radius: 4px; }
a.tag[href="#status/todo"]        { background: #F1EFE8; color: #5F5E5A; border-radius: 4px; }
a.tag[href="#priority/critical"]  { background: #FCEBEB; color: #791F1F; font-weight: 600; }
a.tag[href="#priority/high"]      { background: #FAECE7; color: #993C1D; border-radius: 4px; }
a.tag[href="#priority/medium"]    { background: #FAEEDA; color: #854F0B; border-radius: 4px; }
a.tag[href="#priority/low"]       { background: #EAF3DE; color: #3B6D11; border-radius: 4px; }
a.tag[href^="#type/"]             { background: #EEEDFE; color: #534AB7; border-radius: 4px; }
a.tag[href^="#jira/"]             { background: #E6F1FB; color: #185FA5; border-radius: 4px; }`;
    await fs.writeFile(path.join(this.dataDir, '.obsidian', 'snippets', 'pm-system.css'), css);
  }

  private async writeTemplates(): Promise<void> {
    const templatesDir = path.join(this.dataDir, 'templates');

    await fs.writeFile(path.join(templatesDir, 'task.md'), `---
id: "{{uuid}}"
type: task
title: "{{title}}"
slug: "{{slug}}"
project_id: ""
epic_id: ""
status: todo
priority: medium
jira_issue_key: null
jira_issue_id: null
jira_status: null
jira_assignee: null
jira_synced_at: null
estimated_hours: 0
created_at: "{{date:YYYY-MM-DDTHH:mm:ssZ}}"
updated_at: "{{date:YYYY-MM-DDTHH:mm:ssZ}}"
tags:
  - type/task
  - status/todo
  - priority/medium
aliases: []
cssclasses:
  - pm-task
---

## Opis

## Powiązane
`);
  }

  async rebuildTagIndex(tags: Array<{ tag: Tag; count: number }>): Promise<void> {
    const content = `---
type: index
title: "Tag Index"
tags:
  - type/index
---

# Tag Index

## Statusy — liczba tasków

\`\`\`dataview
TABLE length(rows) AS "Liczba"
FROM "projects"
WHERE type != "index"
GROUP BY status
SORT length(rows) DESC
\`\`\`

## Aktywne taski

\`\`\`dataview
TABLE title AS "Task", status AS "Status", priority AS "Priorytet", jira_issue_key AS "Jira"
FROM "projects"
WHERE type = "task" AND status != "done"
SORT priority ASC, status ASC
\`\`\`

## Epics — terminy

\`\`\`dataview
TABLE title AS "Epic", status AS "Status", due_date AS "Termin"
FROM "projects"
WHERE type = "epic"
SORT due_date ASC
\`\`\`
`;
    await fs.writeFile(path.join(this.dataDir, '_index', 'tags.md'), content);
  }

  async rebuildBoardIndex(): Promise<void> {
    const content = `---
type: index
title: "Board"
tags:
  - type/index
---

# Board

\`\`\`dataviewjs
const statuses = ["todo", "in-progress", "review", "blocked", "done"];
const tasks = dv.pages('"projects"').where(p => p.type === "task");
for (const status of statuses) {
  const items = tasks.where(t => t.status === status);
  dv.header(3, status.toUpperCase() + " (" + items.length + ")");
  dv.list(items.map(t => t.file.link + (t.jira_issue_key ? " \`" + t.jira_issue_key + "\`" : "")));
}
\`\`\`
`;
    await fs.writeFile(path.join(this.dataDir, '_index', 'board.md'), content);
  }

  async rebuildAllTasksIndex(): Promise<void> {
    const content = `---
type: index
title: "Wszystkie taski"
tags:
  - type/index
---

# Wszystkie taski

\`\`\`dataview
TABLE WITHOUT ID
  file.link AS "Task",
  status AS "Status",
  priority AS "Priorytet",
  jira_issue_key AS "Jira",
  jira_status AS "Jira Status",
  jira_assignee AS "Assignee"
FROM "projects"
WHERE type = "task" AND status != "done"
SORT priority ASC, status ASC
\`\`\`
`;
    await fs.writeFile(path.join(this.dataDir, '_index', 'all-tasks.md'), content);
  }

  async rebuildJiraUnlinkedIndex(): Promise<void> {
    const content = `---
type: index
title: "Niezlinkowane z Jirą"
tags:
  - type/index
---

# Taski bez Jira Issue

\`\`\`dataview
TABLE title AS "Task", status AS "Status", priority AS "Priorytet"
FROM "projects"
WHERE type = "task" AND !jira_issue_key
SORT file.mtime DESC
\`\`\`
`;
    await fs.writeFile(path.join(this.dataDir, '_index', 'jira-unlinked.md'), content);
  }
}
```

### 7.6 ConfigStore
```typescript
// infrastructure/config/ConfigStore.ts
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

    if (!await fs.pathExists(configPath)) {
      const defaultConfig: AppConfig = {
        jira: { baseUrl: '', email: '', token: '', defaultBoardId: 0 },
        vault: { dataDir },
      };
      await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
      return defaultConfig;
    }

    return fs.readJSON(configPath);
  }
}
```

---

## 8. PRESENTATION LAYER — REST API

### 8.1 Kompletna lista endpointów
```
# Projekty
GET    /api/projects                      → lista; każdy element zawiera m.in. `jiraLinked` (bool) i `source` (`local` | `jira`) — projekt wyłącznie lokalny gdy brak powiązania z Jirą
POST   /api/projects                      → utwórz projekt wyłącznie w vault (bez Jiry): { title, description?, tags? }
GET    /api/projects/:id                  → szczegóły (+ `jiraLinked`, `source`)
PUT    /api/projects/:id                  → aktualizuj { title?, description?, tags? }
POST   /api/projects/:id/archive          → archiwizuj
GET    /api/projects/:id/progress         → postęp całego projektu
GET    /api/projects/:id/epics            → epics projektu
GET    /api/projects/:id/tasks            → wszystkie taski projektu

# Notatki (projekt)
GET    /api/projects/:projectId/notes     → lista notatek (id, title, slug, projectId, createdAt, updatedAt)
POST   /api/projects/:projectId/notes     → utwórz { title, body? }

# Notatka (po id)
GET    /api/notes/:id                     → szczegóły + pole `body` (markdown)
PUT    /api/notes/:id                     → { title?, body } — nadpisuje frontmatter i body
DELETE /api/notes/:id                     → usuwa plik .md

# Archiwum
GET    /api/archive                       → lista zarchiwizowanych projektów
POST   /api/archive/:id/restore           → przywróć

# Epics
POST   /api/projects/:projectId/epics     → utwórz epic
GET    /api/epics/:id                     → szczegóły
PUT    /api/epics/:id                     → aktualizuj
GET    /api/epics/:id/progress            → EpicProgress (lokalny + Jira)
POST   /api/epics/:id/link-jira           → { jiraEpicKey: "PROJ-50" }
GET    /api/epics/:id/tasks               → taski epica

# Taski
POST   /api/projects/:projectId/tasks     → utwórz task { title, epicId?, priority?, tags? }
GET    /api/tasks/:id                     → szczegóły
PUT    /api/tasks/:id                     → aktualizuj
POST   /api/tasks/:id/link-jira           → { jiraIssueKey: "PROJ-123" }
POST   /api/tasks/:id/sync-jira           → pobierz aktualny status z Jiry
DELETE /api/tasks/:id                     → usuń task

# Tagi
GET    /api/tags                          → lista tagów z licznikami [?category=status]
GET    /api/tags/:slug/items              → encje z danym tagiem

# Jira
GET    /api/jira/boards                   → lista boardów
GET    /api/jira/boards/:boardId/issues   → issues [?sprintId=]
GET    /api/jira/boards/:boardId/sprints  → aktywne sprinty
GET    /api/jira/boards/:boardId/progress → statystyki boarda
POST   /api/jira/sync                     → masowy sync zlinkowanych tasków

# Vault (Obsidian)
POST   /api/vault/init                    → jednorazowa inicjalizacja
POST   /api/vault/rebuild                 → przebuduj _index/ i indeks tagów
```

### 8.2 Express app factory
```typescript
// infrastructure/presentation/app.ts
import express from 'express';
import cors from 'cors';
import { projectsRouter } from './routes/projects.routes';
import { epicsRouter } from './routes/epics.routes';
import { tasksRouter } from './routes/tasks.routes';
import { tagsRouter } from './routes/tags.routes';
import { jiraRouter } from './routes/jira.routes';
import { vaultRouter } from './routes/vault.routes';
import { archiveRouter } from './routes/archive.routes';
import { errorHandler } from './middleware/errorHandler';

export function createExpressApp(config: AppConfig, dataDir: string) {
  const app = express();
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  // Composition root — jedyne miejsce gdzie tworzymy konkretne implementacje
  const parser = new FrontmatterParser();
  const projectRepo = new MarkdownProjectRepository(dataDir, parser);
  const epicRepo = new MarkdownEpicRepository(dataDir, parser);
  const taskRepo = new MarkdownTaskRepository(dataDir, parser);
  const tagRepo = new MarkdownTagRepository(dataDir, parser);
  const vaultWriter = new ObsidianVaultWriter(dataDir);

  let jiraAdapter: JiraApiAdapter | null = null;
  if (config.jira.baseUrl && config.jira.token) {
    const jiraClient = new JiraApiClient(config.jira);
    jiraAdapter = new JiraApiAdapter(jiraClient);
  }

  app.use('/api/projects', projectsRouter(projectRepo, epicRepo, taskRepo));
  app.use(
    '/api/epics',
    epicsRouter(epicRepo, taskRepo, projectRepo, jiraAdapter, config.jira.defaultBoardId),
  );
  app.use('/api/tasks', tasksRouter(taskRepo, projectRepo, epicRepo, jiraAdapter));
  app.use('/api/tags', tagsRouter(tagRepo, vaultWriter));
  app.use('/api/jira', jiraRouter(jiraAdapter, taskRepo, projectRepo, epicRepo));
  app.use('/api/vault', vaultRouter(vaultWriter, tagRepo));
  app.use('/api/archive', archiveRouter(projectRepo));
  app.use(errorHandler);

  return app;
}
```

### 8.3 Error handler middleware
```typescript
// infrastructure/presentation/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err.name === 'ProjectNotFoundError' ||
      err.name === 'EpicNotFoundError' ||
      err.name === 'TaskNotFoundError') {
    return res.status(404).json({ error: err.message });
  }
  if (err.name === 'InvalidTagError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'JiraApiError') {
    return res.status(502).json({ error: err.message });
  }
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
}
```

---

## 9. FRONTEND — Vue 3

### 9.1 Router
```typescript
// core/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/projects', component: () => import('@/features/projects/views/ProjectsView.vue') },
    { path: '/projects/:id', component: () => import('@/features/projects/views/ProjectDetailView.vue') },
    { path: '/projects/:projectId/epics/:id', component: () => import('@/features/epics/views/EpicDetailView.vue') },
    { path: '/tasks/:id', component: () => import('@/features/tasks/views/TaskDetailView.vue') },
    { path: '/tags', component: () => import('@/features/tags/views/TagsView.vue') },
    { path: '/jira', component: () => import('@/features/jira/views/JiraBoardView.vue') },
    { path: '/jira/settings', component: () => import('@/features/jira/views/JiraSettingsView.vue') },
    { path: '/archive', component: () => import('@/features/projects/views/ArchiveView.vue') },
  ],
});
```

### 9.2 API Client
```typescript
// core/http/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error ?? err.message;
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  },
);
```

### 9.3 Pinia Store — projectStore
```typescript
// features/projects/stores/projectStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@/core/http/apiClient';
import type { Project } from '@/shared/types/project.types';

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeProjects = computed(() =>
    projects.value.filter(p => p.status === 'active')
  );

  async function fetchAll() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await apiClient.get<Project[]>('/projects');
      projects.value = data;
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function create(payload: { title: string; description?: string; tags?: string[] }) {
    const { data } = await apiClient.post<Project>('/projects', payload);
    projects.value.unshift(data);
    return data;
  }

  async function archive(id: string) {
    await apiClient.post(`/projects/${id}/archive`);
    projects.value = projects.value.filter(p => p.id !== id);
  }

  async function linkJiraBoard(id: string, boardId: number, projectKey: string) {
    const { data } = await apiClient.put<Project>(`/projects/${id}`, { jiraBoardId: boardId, jiraProjectKey: projectKey });
    const idx = projects.value.findIndex(p => p.id === id);
    if (idx !== -1) projects.value[idx] = data;
    return data;
  }

  return { projects, loading, error, activeProjects, fetchAll, create, archive, linkJiraBoard };
});
```

### 9.4 Pinia Store — jiraStore
```typescript
// features/jira/stores/jiraStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '@/core/http/apiClient';
import type { JiraBoard, JiraIssue, JiraSprint } from '@/shared/types/jira.types';

export const useJiraStore = defineStore('jira', () => {
  const boards = ref<JiraBoard[]>([]);
  const issues = ref<JiraIssue[]>([]);
  const sprints = ref<JiraSprint[]>([]);
  const syncing = ref(false);
  const lastSyncResult = ref<{ synced: number; failed: number } | null>(null);

  async function fetchBoards() {
    const { data } = await apiClient.get<JiraBoard[]>('/jira/boards');
    boards.value = data;
  }

  async function fetchBoardIssues(boardId: number, sprintId?: number) {
    const params = sprintId ? { sprintId: String(sprintId) } : {};
    const { data } = await apiClient.get<JiraIssue[]>(`/jira/boards/${boardId}/issues`, { params });
    issues.value = data;
    return data;
  }

  async function fetchSprints(boardId: number) {
    const { data } = await apiClient.get<JiraSprint[]>(`/jira/boards/${boardId}/sprints`);
    sprints.value = data;
    return data;
  }

  async function syncAll() {
    syncing.value = true;
    try {
      const { data } = await apiClient.post<{ synced: number; failed: number; errors: string[] }>('/jira/sync');
      lastSyncResult.value = { synced: data.synced, failed: data.failed };
      return data;
    } finally {
      syncing.value = false;
    }
  }

  return { boards, issues, sprints, syncing, lastSyncResult, fetchBoards, fetchBoardIssues, fetchSprints, syncAll };
});
```

### 9.5 Typy współdzielone
```typescript
// shared/types/project.types.ts
export interface Project {
  id: string;
  title: string;
  slug: string;
  status: 'active' | 'archived';
  description: string;
  jiraBoardId: number | null;
  jiraBoardName: string | null;
  jiraProjectKey: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// shared/types/epic.types.ts
export interface Epic {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  status: 'todo' | 'in-progress' | 'done' | 'cancelled';
  description: string;
  jiraEpicKey: string | null;
  jiraEpicId: string | null;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EpicProgressDTO {
  epicId: string;
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  todo: number;
  percentageComplete: number;
  jiraLinkedCount: number;
  jiraProgressSummary?: {
    jiraTotal: number;
    jiraDone: number;
    jiraInProgress: number;
    jiraPercentage: number;
    lastSyncedAt: string;
  };
}

// shared/types/task.types.ts
export interface Task {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  epicId: string | null;
  status: 'todo' | 'in-progress' | 'review' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  jiraIssueKey: string | null;
  jiraIssueId: string | null;
  jiraStatus: string | null;
  jiraAssignee: string | null;
  jiraSyncedAt: string | null;
  estimatedHours: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// shared/types/jira.types.ts
export interface JiraBoard { id: number; name: string; projectKey: string; type: string; }
export interface JiraIssue { id: string; key: string; summary: string; status: string; assignee: string | null; priority: string; issueType: string; epicKey: string | null; }
export interface JiraSprint { id: number; name: string; state: string; startDate: string; endDate: string; }

// shared/types/tag.types.ts
export interface TagWithCount { slug: string; label: string; category: string; count: number; }
export interface TaggedItems { projects: Project[]; epics: Epic[]; tasks: Task[]; }
```

---

## 10. KONFIGURACJA — pliki setup

### 10.1 `package.json` (root)
```json
{
  "name": "pmdash",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r run dev",
    "build": "pnpm -r run build",
    "typecheck": "pnpm -r run typecheck"
  }
}
```

### 10.2 `pnpm-workspace.yaml`
```yaml
packages:
  - 'packages/*'
```

### 10.3 `packages/backend/package.json`
```json
{
  "name": "@pmdash/backend",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "gray-matter": "^4.0.3",
    "js-yaml": "^4.1.0",
    "fs-extra": "^11.2.0",
    "fast-glob": "^3.3.2",
    "uuid": "^9.0.0",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/js-yaml": "^4.0.9",
    "@types/fs-extra": "^11.0.4",
    "@types/uuid": "^9.0.7",
    "@types/node": "^20.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
```

### 10.4 `packages/frontend/package.json`
```json
{
  "name": "@pmdash/frontend",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.7",
    "axios": "^1.6.8"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "vite": "^5.2.0",
    "vue-tsc": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

### 10.5 `packages/backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 10.6 `packages/frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
```

### 10.7 `.gitignore`
```gitignore
node_modules/
dist/
data/config.json
data/.obsidian/plugins/
*.log
.DS_Store
```

---

## 11. BACKEND STARTUP SEQUENCE (`src/index.ts`)

```typescript
import * as path from 'path';
import * as fs from 'fs-extra';
import { ConfigStore } from './infrastructure/config/ConfigStore';
import { ObsidianVaultWriter } from './infrastructure/persistence/ObsidianVaultWriter';
import { createExpressApp } from './infrastructure/presentation/app';

// Domyślnie `data/` w root monorepo; `PM_DATA_DIR` może być absolutem lub segmentem względem root.
const DATA_DIR = path.resolve(__dirname, '../../..', process.env.PM_DATA_DIR ?? 'data');

async function bootstrap() {
  await fs.ensureDir(DATA_DIR);
  const config = await ConfigStore.load(DATA_DIR);
  const vaultWriter = new ObsidianVaultWriter(DATA_DIR);

  const obsidianDir = path.join(DATA_DIR, '.obsidian');
  const isFirstRun = !await fs.pathExists(obsidianDir);

  if (isFirstRun) {
    console.log('🗂  Inicjalizacja Obsidian vault...');
    await vaultWriter.initVault();
    console.log('✅ Vault gotowy. Otwórz katalog "data/" w Obsidian jako vault.');
  }

  const app = createExpressApp(config, DATA_DIR);
  const PORT = Number(process.env.PORT ?? 3001);

  app.listen(PORT, () => {
    console.log(`🚀 Backend:  http://localhost:${PORT}`);
    console.log(`📁 Data dir: ${DATA_DIR}`);
    if (!config.jira.token) {
      console.warn('⚠️  Brak konfiguracji Jira. Uzupełnij data/config.json');
    }
  });
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
```

---

## 12. KOLEJNOŚĆ IMPLEMENTACJI (dla agenta AI)

Implementuj w tej kolejności — każdy krok jest niezależny i testowalny:

### Faza 1 — Core Infrastructure (Backend)
1. `FrontmatterParser` — `parseFile`, `serialize`, `updateFrontmatterOnly`, `parseTags`, `parseAliases`
2. `Tag` Value Object + `AutoTagBuilder`
3. `WikiLink` Value Object + `WikiLinkFactory`
4. `EpicProgress` Value Object
5. Wszystkie Entities: `Project`, `Epic`, `Task`
6. Wszystkie Ports (interfejsy): `IProjectRepository`, `IEpicRepository`, `ITaskRepository`, `ITagRepository`, `IJiraAdapter`
7. `MarkdownProjectRepository` — pełna implementacja
8. `MarkdownEpicRepository` — analogicznie do Project
9. `MarkdownTaskRepository` — analogicznie + `findAllLinkedToJira()`
10. `ConfigStore`
11. `ObsidianVaultWriter.initVault()` + wszystkie metody `rebuild*()`

### Faza 2 — Application Layer (Use Cases)
12. `CreateProject`, `ListProjects`, `GetProject`, `ArchiveProject`, `RestoreProject`
13. `CreateEpic`, `ListEpics`, `GetEpic`, `GetEpicProgress` (konstruktor: `IEpicRepository`, `ITaskRepository`, `IProjectRepository`, `IJiraAdapter | null`, `defaultBoardId` z configu)
14. `CreateTask`, `ListTasks`, `GetTask`, `UpdateTask`
15. `LinkTaskToJira`, `SyncTaskFromJira`
16. `LinkEpicToJira`
17. `ListTags`, `GetItemsByTag`

### Faza 3 — Jira Integration
18. `JiraApiClient`
19. `JiraResponseMapper`
20. `JiraApiAdapter` — wszystkie metody
21. `ListBoards`, `ListBoardIssues`, `ListBoardSprints`, `GetBoardProgress`, `SyncAllLinkedTasks`

### Faza 4 — REST API
22. Express app factory + composition root
23. `errorHandler` middleware
24. Routes + Controllers dla: projects, archive, epics, tasks, tags, jira, vault
25. Backend `index.ts` z bootstrap sequence

### Faza 5 — Frontend
26. Vite + Vue 3 + TypeScript setup
27. `apiClient.ts` (axios)
28. Router z wszystkimi routes
29. Wszystkie typy: `project.types.ts`, `epic.types.ts`, `task.types.ts`, `jira.types.ts`, `tag.types.ts`
30. Pinia stores: `projectStore`, `epicStore`, `taskStore`, `jiraStore`, `tagStore`
31. Shared komponenty: `BaseButton`, `BaseModal`, `BaseInput`, `StatusBadge`, `PriorityBadge`
32. Feature: Projects (ProjectsView, ProjectDetailView, ProjectCard, ProjectForm)
33. Feature: Epics (EpicsView, EpicDetailView, EpicProgress z dwoma paskami)
34. Feature: Tasks (TaskDetailView, TaskCard, JiraLinkBadge)
35. Feature: Jira (JiraBoardView, IssuePicker modal, SyncButton, BoardProgressChart)
36. Feature: Tags (TagsView, TagCloud, TagFilterPanel)

---

## 13. REGUŁY SPÓJNOŚCI DANYCH

### 13.1 Źródło prawdy
**Backend API jest autorytatywny.** Obsidian jest widokiem read-heavy.

### 13.2 Zasady zapisu
- Przy każdym `save()` backend **nadpisuje tylko frontmatter**, ciało Markdown (po separatorze `---`) pozostaje nienaruszone
- Pola systemowe (`id`, `created_at`, `project_id`, `epic_id`) nigdy nie są nadpisywane przez Obsidian
- Po edycji w Obsidian użytkownik może wywołać `POST /api/vault/rebuild` żeby odświeżyć indeksy

### 13.3 Sync z Jirą
- Sync jest **on-demand** (nie polling) — użytkownik inicjuje przez UI lub `POST /api/jira/sync`
- Ostatnio znany status Jiry jest zapisany w `jira_status` i `jira_synced_at` — aplikacja działa offline
- Nigdy nie piszemy z powrotem do Jiry — jesteśmy consumer-only

### 13.4 Archiwizacja
- Archiwizacja = fizyczne przeniesienie folderu `projects/{slug}/` → `archive/{slug}/`
- Przywrócenie = przeniesienie z powrotem + zmiana `status: active`
- Nie usuwamy plików — zawsze przenosimy

---

## 14. OBSIDIAN — instrukcja uruchomienia

Po `pnpm dev` i pierwszym starcie backendu:

1. Otwórz Obsidian
2. "Open folder as vault" → wskaż katalog `data/`
3. Zaufaj vault (allow plugins)
4. Zainstaluj community plugins: Dataview, Templater, Tag Wrangler, Projects
5. Przeładuj Obsidian — CSS snippet `pm-system` zostaje automatycznie aktywowany
6. Otwórz `_index/tags.md` — widać żywe Dataview queries
7. Otwórz `_index/board.md` — kanban view tasków

Tagi statusów i priorytetów są automatycznie kolorowane przez CSS snippet.
Aliasy umożliwiają szybkie znajdowanie tasków przez Jira issue key (Cmd+O → wpisz "PROJ-123").

---

*Koniec specyfikacji. Wersja: 1.0 | Data: 2025-04-23*
