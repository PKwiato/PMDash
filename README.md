# PMDash

Lokalny dashboard do zarządzania projektami dla **jednego użytkownika** (bez logowania). Stan projektów, epików i zadań trzymany jest w plikach **Markdown z frontmatterem YAML** w katalogu vaultu (domyślnie `data/`), tak aby można było ten sam folder otworzyć w **Obsidian** i przeglądać lub uzupełniać notatki ręcznie. Backend udostępnia **REST API**; frontend to **Vue 3** (Vite). Planowana jest integracja odczytu z **Jira Cloud** (PAT / API token).

## Po co ten projekt

- scentralizować widok projektów i postępu obok notatek PM,
- trzymać „źródło prawdy” w plikach pod kontrolą użytkownika (git, backup, Obsidian),
- umożliwić późniejszy sync statusów z Jiry **tylko do aplikacji** (bez zapisu z powrotem do Jiry).

## Architektura

| Warstwa | Technologia |
|--------|--------------|
| Monorepo | `pnpm` workspaces — pakiety `@pmdash/frontend`, `@pmdash/backend` |
| Frontend | Vue 3, TypeScript, Vite (port **5173**), proxy `/api` → backend |
| Backend | Node.js, Express, TypeScript (port **3001**) |
| Dane | Katalog `data/` — m.in. `projects/`, `archive/`, `config.json` (sekrety, gitignored) |
| Styl kodu backendu | Clean Architecture: `domain/` → `application/` → `infrastructure/` (repozytoria markdown, Jira, Obsidian) oraz **`infrastructure/presentation/`** (Express, routes) |

Pełna specyfikacja funkcjonalna i struktur katalogów: [`.cursor/PM_SYSTEM_SPEC.md`](.cursor/PM_SYSTEM_SPEC.md).

## Funkcje (MVP+)

- **Projekty wyłącznie lokalne** — `POST /api/projects` tworzy projekt w Markdownzie bez Jiry. W odpowiedziach API pola `jiraLinked` i `source` (`local` albo `jira`).
- **Integracja z Jira Cloud** — Pobieranie zadań z tablic (Board), wyświetlanie statusów, osób przypisanych i priorytetów w czasie rzeczywistym.
- **Notatki przy projekcie** — pliki `data/projects/{slug}/notes/{note-slug}.md`. API: `GET/POST /api/projects/:projectId/notes`, `GET/PUT/DELETE /api/notes/:id`, oraz globalny listing `GET /api/notes`.
- **Auto-scan zadań w notatkach** — System automatycznie wykrywa klucze Jira (np. `ABC-123`) w treści notatek i pobiera ich aktualny status z API Jira, wyświetlając go w UI obok notatki.
- **Prywatne notatki do zadań** — Możliwość przypisania notatki Markdown bezpośrednio do konkretnego zadania Jira (przez umieszczenie klucza w tytule lub treści).

Plan wdrożenia (historia): [`.cursor/PLAN_NOTES_AND_LOCAL_PROJECTS.md`](.cursor/PLAN_NOTES_AND_LOCAL_PROJECTS.md).

## Wymagania

- **Node.js** 20+ (zalecane 22)
- **pnpm** 9+ (`corepack enable` / instalacja globalna)

## Uruchomienie lokalne

Z katalogu głównego repozytorium:

```bash
pnpm install
pnpm dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3001>

Katalog danych domyślnie to **`data/` w root repozytorium** (niezależnie od `cwd` przy starcie z workspace). Możesz nadpisać:

- `PM_DATA_DIR` — ścieżka względem root monorepo lub absolutna (patrz `packages/backend/src/index.ts`).
- `PORT` — port backendu (domyślnie `3001`).

Pierwszy start backendu utworzy szkiept pod Obsidian w `data/` (jeśli brak `.obsidian`). Konfiguracja Jiry: utwórz/edytuj `data/config.json` (szablon w specyfikacji).

## Docker

Tak — stack można podnieść **Docker Compose** (dwa serwisy: backend zbudowany `tsc` + frontend z dev serwerem Vite).

```bash
docker compose up --build
```

Następnie w przeglądarce: **<http://localhost:5173>** (API idzie przez proxy Vite do serwisu `backend` w sieci Docker). Dane vaultu są w wolumenie `pmdash_data` (ścieżka w kontenerze `/app/data`).

Wymagania: **Docker Engine** 24+ i plugin **Compose V2** (`docker compose`). Na maszynie musi działać daemon Dockera (np. Docker Desktop); skład `docker-compose.yml` i Dockerfileów jest przygotowany do `docker compose build` / `up` w typowym środowisku developerskim.

### Ograniczenia obecnej konfiguracji Docker

- Frontend w obrazie to **tryb developerski** (`vite dev`), nie zoptymalizowany build statyczny za nginx — wystarczy do developmentu i smoke testów.
- CORS backendu ustawiony jest na `http://localhost:5173`; przy innym hoście/portcie ustaw zmienną `CORS_ORIGIN` dla serwisu `backend` w `docker-compose.yml`.

## Skrypty

| Polecenie | Opis |
|-----------|------|
| `pnpm dev` | równolegle dev frontend + backend |
| `pnpm build` | build wszystkich pakietów |
| `pnpm typecheck` | `tsc` / `vue-tsc` we wszystkich pakietach |
