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

1. Backend: CreateProject + POST + `jiraLinked` / `source`.
2. Backend: Note + repozytorium + CRUD + `app.ts`.
3. Frontend: router + widoki.
4. Dokumentacja: `PM_SYSTEM_SPEC.md`, `README.md`.
