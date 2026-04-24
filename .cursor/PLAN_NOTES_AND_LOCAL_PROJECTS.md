# Plan: notatki przy projektach + projekty tylko w Markdown (bez Jiry)

Kopia robocza planu funkcjonalnego (źródło: Cursor plan „Notatki i projekty lokalne”).

## Kontekst

- Dane: vault w `data/` — projekty w `projects/{slug}/README.md` (frontmatter + body).
- Encja `Project` ma `jiraBoardId`, `jiraProjectKey` jako `null` gdy brak Jiry; `AutoTagBuilder.forProject` dodaje `jira/linked` tylko gdy `jiraBoardId !== null`.
- API: `projects.routes.ts` — rozszerzone o `POST /` i pole `jiraLinked` / `source` w JSON.
- Notatki: `projects/{slug}/notes/{note-slug}.md` z `type: note`.

## Decyzje

| Temat | Decyzja |
|-------|---------|
| Lokalizacja notatek | `data/projects/{project-slug}/notes/{note-slug}.md` — płaska lista (v1). |
| Model notatki | Frontmatter: `id`, `type: note`, `title`, `slug`, `project_id`, `created_at`, `updated_at`, `tags`, `cssclasses: [pm-note]`; body = Markdown. |
| Projekt bez Jiry | `jiraLinked` pochodne: `jiraBoardId != null \|\| jiraProjectKey != null`; `source`: `local` \| `jira`. |

## Endpointy (v1)

- `POST /api/projects` — tworzenie projektu wyłącznie lokalnego (bez Jiry).
- `GET /api/projects/:projectId/notes`, `POST /api/projects/:projectId/notes`
- `GET /api/notes/:id`, `PUT /api/notes/:id`, `DELETE /api/notes/:id`

## Frontend (MVP)

- Lista projektów z badge „Tylko lokalnie” gdy `source === 'local'`.
- Formularz nowego projektu.
- Widok `/projects/:id` — lista notatek, dodawanie, edycja textarea, usuwanie.

## Kolejność implementacji
- [x] **Faza 1: Notatki i projekty lokalne**
    1. Backend: CreateProject + POST + `jiraLinked` / `source`.
    2. Backend: Note + repozytorium + CRUD + `app.ts`.
    3. Frontend: router + widoki (Projects, Notes).
- [x] **Faza 2: Integracja Jira i Auto-scan**
    1. Frontend: Pinia `jiraStore` (board fetch, bulk lookup).
    2. Frontend: Pinia `notesStore` (auto-scan logic).
    3. Frontend: `TaskListView` (board data), `TaskDetailView` (live status + private note editor).
    4. Frontend: Dashboard (dynamic stats).
- [ ] **Faza 3: Polerowanie i konfiguracja**
    1. Konfigurowalne Board ID.
    2. Obsługa błędów API Jira.
    3. Wsparcie dla wielu tablic.
