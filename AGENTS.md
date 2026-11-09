# PB Downloader – Agent Instructions

## Project Overview

Full-stack web application for automating file downloads via configurable Puppeteer workflows.

```
pbdownloader/
├── backend/      # NestJS 11, TypeORM, BullMQ, Puppeteer, SQLite, Socket.io
├── frontend/     # Angular 21, NgRx, PrimeNG, socket.io-client
└── docker-compose.yml
```

---

## Build / Lint / Test Commands

### Backend (`cd backend`)

```bash
npm run build          # Compile TypeScript → dist/
npm run start:dev      # Dev server with watch (port 3000)
npm run start:prod     # Run compiled output
npm run lint           # ESLint with --fix
npm run format         # Prettier --write on src/ and test/
npm run test           # Run all unit tests (Jest)
npm run test:watch     # Jest watch mode
npm run test:cov       # Jest with coverage
npm run test:e2e       # E2E tests (test/jest-e2e.json)
```

**Run a single test file:**
```bash
npx jest src/downloaders/downloaders.service.spec.ts
```

**Run tests matching a name pattern:**
```bash
npx jest --testNamePattern="should create a downloader"
```

### Frontend (`cd frontend`)

```bash
npm run build          # ng build (production)
npm run watch          # ng build --watch (dev)
npm start              # ng serve (port 4200, proxy → backend:3000)
npm test               # Vitest (ng test)
```

**Run a single spec file:**
```bash
npx vitest run src/app/app.spec.ts
```

### Docker

```bash
docker-compose up --build    # Build and start all services
docker-compose up -d         # Detached mode
```

Services: `frontend` (port 80), `backend`, `redis`.

---

## Architecture

### Backend

- **NestJS modules**: `DownloadersModule`, `JobsModule`
- **Database**: SQLite via `better-sqlite3` + TypeORM (`synchronize: true` in dev)
- **Queue**: BullMQ with Redis — queue name is `download` (constant `DOWNLOAD_QUEUE`)
- **WebSocket**: `JobsGateway` on namespace `/jobs`, events: `job:created`, `job:updated`, `job:progress`
- **Static files**: Served from `downloads/` at `/api/files/`
- **Config**: `DB_PATH`, `DOWNLOADS_PATH`, `REDIS_HOST`, `REDIS_PORT` env vars

### Frontend

- **Standalone components** (no NgModules)
- **NgRx**: functional effects (`createEffect` with `{ functional: true }`), `@ngrx/entity` adapters
- **Routing**: lazy-loaded pages — `/` (download page), `/downloaders` (management)
- **API**: all calls go through `ApiService` at `/api` prefix (proxied in dev via `proxy.conf.json`)
- **WebSocket**: `WebsocketService` wraps `socket.io-client`, exposes Observables consumed by NgRx effects

---

## Code Style

### TypeScript (both backend and frontend)

- **Prettier**: single quotes, trailing commas (backend), `printWidth: 100` (frontend)
- **Backend**: `noImplicitAny: false`, `strictNullChecks: true`, target `ES2023`
- **Frontend**: `strict: true`, `strictTemplates: true`, target `ES2022`
- Use `async/await` for async operations; avoid raw Promise chains
- Prefer explicit return types on public methods
- Use `readonly` on injected dependencies in NestJS constructors

### Imports

- Group imports: framework/library imports first, then internal imports
- Backend: use path aliases from `tsconfig.json` (`baseUrl: "./"`), use `* as path from 'path'` style for Node builtins
- Frontend: import NgRx actions as namespace (`import * as DownloadersActions from './downloaders.actions'`)
- Never use barrel `index.ts` files unless they already exist

### Naming Conventions

- **Files**: `kebab-case` (e.g. `download-job.entity.ts`, `downloaders.effects.ts`)
- **Classes**: `PascalCase`
- **Variables/functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` (e.g. `DOWNLOAD_QUEUE`)
- **Enums**: `PascalCase` name, `UPPER_CASE` values (e.g. `JobStatus.RUNNING`)
- **DTOs**: suffix with `Dto` (e.g. `CreateDownloaderDto`)
- **Entities**: suffix with `.entity.ts`
- **NgRx**: actions in `[Feature] Event Name` format, effects exported as `featureName$`

### Backend Patterns

- Controllers use `ParseIntPipe` for numeric route params
- All DTOs use `class-validator` decorators (`@IsString`, `@IsNotEmpty`, etc.)
- Services inject repositories via `@InjectRepository(Entity)`
- Use `NestJS Logger` (`private readonly logger = new Logger(ClassName.name)`) for logging
- BullMQ processors extend `WorkerHost` and implement `process(job: Job<T>)`
- WebSocket gateway uses `@WebSocketGateway`, `@WebSocketServer`, `@SubscribeMessage`

### Frontend Patterns

- Components are standalone (`standalone: true` in `@Component`)
- Use `inject()` function in functional effects instead of constructor injection
- NgRx state shape: `EntityState<T> & { loading: boolean; error: string | null }`
- Reducers use `EntityAdapter` methods (`setAll`, `addOne`, `upsertOne`, `removeOne`)
- Always pipe `catchError` in effects, dispatching a `*Failure` action with `{ error: err.message }`
- Use `mergeMap` for independent operations, `switchMap` for cancellable ones (e.g. search)
- Template files: `.html` extension, styles: `.scss` extension

### Error Handling

- Backend: throw NestJS exceptions (`NotFoundException`, `BadRequestException`) from services
- Backend processor: catch errors in `try/catch`, call `this.failJob(job, err.message)`
- Frontend effects: always `catchError` → dispatch `*Failure` action, never let effects complete without error handling
- Frontend components: read `error` from store selector, display via PrimeNG `p-message` or toast

---

## Key Entities

```
Downloader { id, name, urlPattern (regex), description?, createdAt, updatedAt, steps: Step[] }
Step       { id, order, type: StepType (CLICK|FILL|DOWNLOAD), selector, value?, downloaderId }
DownloadJob{ id, url, downloaderId, status: JobStatus (PENDING|RUNNING|DONE|FAILED),
             filePath?, fileName?, errorMessage?, createdAt, updatedAt }
```

---

## Important Notes

- TypeORM `synchronize: true` is used in development — schema is auto-synced, no migration files
- Puppeteer runs with `--no-sandbox` for Docker compatibility
- Downloads are stored in `backend/downloads/`, served via `/api/files/:filename`
- The `activeDownloads` Map in `download.processor.ts` tracks CDP download GUIDs to job IDs for progress events
- Frontend dev proxy (`proxy.conf.json`) forwards `/api` and `/socket.io` to `http://localhost:3000`
