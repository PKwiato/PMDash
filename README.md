# PMDash

Lokalny dashboard PM dla **jednego użytkownika** (bez logowania). Projekty, epiki, zadania i notatki żyją w plikach **Markdown z frontmatterem YAML** w katalogu vaultu (domyślnie `data/`), więc ten sam folder możesz otworzyć w **Obsidian**. Backend udostępnia **REST API**; frontend to **Vue 3** + **Vite**. Opcjonalna integracja z **Jira Cloud** (token API + URL) — odczyt statusów i boardów; zapis do Jiry nie jest celem aplikacji.

## Co aplikacja potrafi

### Dane i vault

- **Projekty lokalne** — tworzenie projektów w Markdownzie (`POST /api/projects`), slugi, metadane w frontmatterze.
- **Tryb vaultu production / test** — osobne ścieżki do „prawdziwych” notatek i testowych; przełączanie z poziomu UI (Settings) zapisuje się w `config.json`.
- **Szkielet Obsidian** — przy pierwszym starcie backend może utworzyć podstawowy katalog `.obsidian` w katalogu danych.
- **Archiwum projektów** — lista zarchiwizowanych i przywracanie (`/api/archive`).
- **Tagi** — odczyt tagów z vaultu (`/api/tags`), powiązanie z zapisem plików (Obsidian writer).

### Notatki

- **Notatki per projekt** — `GET/POST /api/projects/:projectId/notes`.
- **Globalny dostęp po ID** — `GET /api/notes`, szczegóły `GET/PUT/DELETE /api/notes/:id`.
- **Zadania (- [ ]) w notatkach** — agregacja z wielu plików (`GET /api/notes/tasks`).
- **Załączniki** — upload i serwowanie plików dla notatki (`POST/GET …/attachments`).
- **Edytor Milkdown** — edycja treści w UI; upload obrazów przez API załączników (wymaga istniejącej zapisanej notatki tam, gdzie to sprawdzane).

### Jira (gdy skonfigurujesz `config.json`)

- **Boardy i issue** — lista boardów, issue na boardzie (filtrowanie m.in. po aktywnym sprincie), pobieranie po kluczach (`POST /api/jira/issues/bulk`).
- **Konfiguracja domyślnego boardu** — `GET/PATCH /api/jira/config` (używane przez listę zadań / Kanban / ustawienia).
- **Wykrywanie kluczy w treści** — np. `PROJ-123` w notatkach; UI może dociągać aktualny status issue z Jiry.
- **Clockwork / analiza worklogów** — endpoint `GET /api/clockwork/analysis` (zakres dat, board); w UI widok **Clockwork analysis** (heurystyki typu weekend, brak godzin, nadgodziny — wg implementacji serwisu).

### Widoki frontendu (Vue Router)

- **Dashboard** — podsumowanie / wejście do aplikacji.
- **Lista zadań** (`/tasks`) i **Kanban** (`/kanban`) — na danych z wybranego boardu Jiry (wymaga konfiguracji).
- **Szczegół zadania** (`/tasks/:id`) — opis Jiry, markdown, **prywatna notatka** powiązana z kluczem zadania (tworzenie / aktualizacja przez vault).
- **Notatki** (`/notes`) — przegląd i edycja notatek z modalem Milkdown / tryb źródłowy.
- **Zadania z notatek** (`/notes/tasks`) — zbiorczy widok checkboxów z plików.
- **Ustawienia** (`/settings`) — domyślny board Jiry, ścieżki vaultu production/test, tryb aktywny.
- **Motyw** — jasny / ciemny (preferencja w przeglądarce).

Starsze ścieżki **`/projects-old`** nadal istnieją jako odniesienie do wcześniejszego widoku projektów.

### Architektura i API

| Warstwa | Technologia |
|--------|-------------|
| Monorepo | `pnpm` workspaces — `@pmdash/frontend`, `@pmdash/backend` |
| Frontend | Vue 3, TypeScript, Vite (domyślnie port **5173**), proxy `/api` → backend |
| Backend | Node.js, Express, TypeScript (domyślnie port **3001**) |
| Dane | Katalog `data/` — `projects/`, `archive/`, `config.json` (sekrety — nie commituj tokenów) |
| Backend (styl) | Clean Architecture: `domain/` → `application/` → `infrastructure/` oraz `infrastructure/presentation/` (Express) |

Pełniejsza specyfikacja: [`.cursor/PM_SYSTEM_SPEC.md`](.cursor/PM_SYSTEM_SPEC.md).

## Zmienne środowiskowe

### Backend (Node / `docker-compose` → serwis `backend`)

| Zmienna | Domyślnie | Opis |
|--------|-----------|------|
| `PM_DATA_DIR` | `data` | Katalog danych vaultu (względem **korzenia repozytorium** przy starcie z `packages/backend`, albo ścieżka absolutna). Tu leżą projekty, `config.json`, archiwum itd. |
| `PORT` | `3001` | Port HTTP API. |
| `CORS_ORIGIN` | `http://localhost:5173` | Dozwolony origin dla przeglądarkowego CORS (URL frontendu). Przy innym hoście/portcie ustaw zgodnie z adresem UI. |
| `NODE_ENV` | — | Gdy ustawione na `production`, handler błędów **nie zwraca** klientowi szczegółów ani stack trace przy błędzie 500 (tylko ogólny komunikat). W development pozostają dodatkowe pola diagnostyczne. |

### Frontend — development (`vite`, lokalnie lub w Dockerze)

| Zmienna | Domyślnie | Opis |
|--------|-----------|------|
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:3001` | Cel proxy Vite dla żądań **`/api`** (dev server przekierowuje je na backend). W Dockerze ustaw np. na `http://backend:3001` (patrz `docker-compose.yml`). |

### Frontend — adres API z poziomu przeglądarki

| Zmienna | Domyślnie | Opis |
|--------|-----------|------|
| `VITE_API_BASE_URL` | `/api` | Bazowy URL dla klienta HTTP (axios). **Puste / nie ustawione** → relatywne `/api` (działa z proxy Vite i gdy UI i API są pod tą samą origin). Ustaw pełny URL (np. `http://localhost:3001/api`), jeśli serwujesz frontend bez proxy i backend jest pod innym origin. Bez końcowego `/`. |

Zmienne z prefiksem `VITE_` są wbudowywane w bundle **w czasie builda** (`pnpm build`); po zmianie uruchom ponownie dev server lub przebuduj frontend.

## Plik `data/config.json` (nie są to zmienne ENV)

Tworzony / uzupełniany przy pierwszym starcie. Najważniejsze sekcje:

- **`jira`** — `baseUrl`, `email`, `token` (PAT/API token), `defaultBoardId`. Bez tokena backend działa, ale endpointy Jiry zwracają sensowne błędy konfiguracji.
- **`vault`** — `productionDir`, `testDir`, `activeMode` (`production` | `test`). Steruje tym, skąd czytane są notatki przy zapisanych ścieżkach.

Szczegóły pól: specyfikacja w repo oraz pierwsze logi backendu przy braku Jiry.

## Wymagania

- **Node.js** 20+ (zalecane 22)
- **pnpm** 9+ (`corepack enable` lub instalacja globalna)

## Uruchomienie lokalne

```bash
pnpm install
pnpm dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3001>

Pierwszy start backendu może utworzyć szkielet Obsidian w katalogu danych. Skonfiguruj Jirę w `data/config.json` (patrz wyżej).

## Docker

```bash
docker compose up --build
```

Przeglądarka: **<http://localhost:5173>**; żądania `/api` idą przez Vite do serwisu `backend`. Dane w wolumenie `pmdash_data` → `/app/data` w kontenerze backendu.

**Uwagi:**

- Frontend w Compose jest w trybie **developerskim** (`vite dev`), nie statyczny nginx.
- W `docker-compose.yml` dla backendu ustawione są m.in. `PORT`, `CORS_ORIGIN`; dla frontendu `VITE_API_PROXY_TARGET`.

## Skrypty

| Polecenie | Opis |
|-----------|------|
| `pnpm dev` | równolegle dev frontend + backend |
| `pnpm build` | build wszystkich pakietów |
| `pnpm typecheck` | `tsc` / `vue-tsc` we wszystkich pakietach |
| `pnpm lint` | ESLint dla `packages/*/src` |
| `pnpm format` | Prettier — zapis formatowania |
| `pnpm format:check` | Prettier — tylko weryfikacja |

## Po co ten projekt

- scentralizować widok projektów i postępu obok notatek PM,
- trzymać „źródło prawdy” w plikach pod kontrolą użytkownika (git, backup, Obsidian),
- podglądać statusy z Jiry w aplikacji bez obowiązkowego zapisu z powrotem do Jiry.

Plan / historia notatek i projektów lokalnych: [`.cursor/PLAN_NOTES_AND_LOCAL_PROJECTS.md`](.cursor/PLAN_NOTES_AND_LOCAL_PROJECTS.md).
