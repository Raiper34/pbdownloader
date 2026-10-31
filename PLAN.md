# PDownloader - Implementation Plan

## Overview

Selfhosted web application for downloading files from the internet using automated browser interactions (Puppeteer). Users define download jobs with step-by-step browser instructions (login, navigation, click download, etc.). The system processes these jobs in the background and streams progress via WebSockets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS |
| Frontend | Angular + PrimeNG |
| Database | SQLite (via TypeORM) |
| Job Queue | BullMQ (Redis) |
| Browser Automation | Puppeteer |
| Real-time | WebSockets (Socket.io) |
| State Management | NgRx |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Angular Frontend                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  NgRx    │  │ PrimeNG  │  │  WebSocket Client  │ │
│  │  Store   │  │   UI     │  │  (progress feed)   │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP REST + WebSocket
┌──────────────────────▼──────────────────────────────┐
│                    NestJS Backend                    │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ REST API  │  │ BullMQ   │  │  WebSocket GW    │  │
│  │ (CRUD)    │  │ Queue    │  │  (Socket.io)     │  │
│  └───────────┘  └─────┬────┘  └──────────────────┘  │
│  ┌───────────┐         │                             │
│  │  TypeORM  │  ┌──────▼──────────────────────┐     │
│  │  SQLite   │  │  Job Worker (Puppeteer)      │     │
│  └───────────┘  │  - executes job steps        │     │
│                 │  - emits progress events     │     │
│                 └─────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
pdownloader/
├── backend/                        # NestJS application
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── config/                 # Configuration (DB, Redis, etc.)
│   │   ├── database/               # TypeORM entities & migrations
│   │   │   └── entities/
│   │   │       ├── job.entity.ts
│   │   │       └── job-step.entity.ts
│   │   ├── jobs/                   # Job management module
│   │   │   ├── jobs.module.ts
│   │   │   ├── jobs.controller.ts  # REST CRUD endpoints
│   │   │   ├── jobs.service.ts
│   │   │   ├── jobs.processor.ts   # BullMQ worker (Puppeteer logic)
│   │   │   └── dto/
│   │   │       ├── create-job.dto.ts
│   │   │       └── update-job.dto.ts
│   │   ├── gateway/                # WebSocket gateway
│   │   │   └── progress.gateway.ts
│   │   └── downloads/              # Downloaded files management
│   │       ├── downloads.module.ts
│   │       ├── downloads.controller.ts
│   │       └── downloads.service.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                       # Angular application
    ├── src/
    │   ├── app/
    │   │   ├── app.module.ts
    │   │   ├── app.routes.ts
    │   │   ├── core/
    │   │   │   ├── services/
    │   │   │   │   ├── api.service.ts       # HTTP calls
    │   │   │   │   └── websocket.service.ts # Socket.io client
    │   │   │   └── models/
    │   │   │       ├── job.model.ts
    │   │   │       └── job-step.model.ts
    │   │   ├── store/                       # NgRx store
    │   │   │   ├── jobs/
    │   │   │   │   ├── jobs.actions.ts
    │   │   │   │   ├── jobs.reducer.ts
    │   │   │   │   ├── jobs.effects.ts
    │   │   │   │   └── jobs.selectors.ts
    │   │   │   └── app.state.ts
    │   │   └── features/
    │   │       ├── jobs/                    # Jobs list page
    │   │       │   ├── jobs-list/
    │   │       │   └── job-detail/
    │   │       ├── job-editor/              # Job & steps editor
    │   │       │   └── step-builder/        # Step-by-step builder UI
    │   │       └── downloads/               # Downloaded files page
    ├── package.json
    └── tsconfig.json
```

---

## Data Models

### Job Entity
```
Job {
  id: number (PK)
  name: string
  description: string
  targetUrl: string          // Starting URL for the browser
  steps: JobStep[]           // Ordered list of steps
  status: JobStatus          // idle | queued | running | completed | failed
  cronExpression?: string    // Optional: schedule job periodically
  downloadPath: string       // Where to save downloaded files
  createdAt: Date
  updatedAt: Date
}
```

### JobStep Entity
```
JobStep {
  id: number (PK)
  jobId: number (FK)
  order: number              // Step execution order
  type: StepType             // navigate | click | fill | wait | download | screenshot
  selector?: string          // CSS selector for target element
  value?: string             // Input value (for fill step)
  url?: string               // URL (for navigate step)
  timeout?: number           // Wait timeout in ms
  description: string        // Human-readable description
}
```

### Step Types
| Type | Description | Parameters |
|---|---|---|
| `navigate` | Go to URL | `url` |
| `click` | Click an element | `selector` |
| `fill` | Fill an input field | `selector`, `value` |
| `wait` | Wait for element / timeout | `selector` or `timeout` |
| `download` | Trigger file download | `selector` (download button) |
| `screenshot` | Take screenshot for debug | - |

### JobStatus Enum
- `idle` - defined, not yet queued
- `queued` - added to BullMQ queue
- `running` - Puppeteer is executing steps
- `completed` - finished successfully
- `failed` - error occurred

---

## Backend Modules

### 1. JobsModule
- **GET /jobs** - List all jobs
- **GET /jobs/:id** - Get job detail with steps
- **POST /jobs** - Create new job
- **PUT /jobs/:id** - Update job
- **DELETE /jobs/:id** - Delete job
- **POST /jobs/:id/run** - Manually trigger job (enqueue to BullMQ)

### 2. BullMQ Job Processor (`jobs.processor.ts`)
- Picks up jobs from the queue
- Launches Puppeteer headless browser
- Iterates through `JobStep[]` in order
- For each step type, executes corresponding Puppeteer action
- Emits real-time progress events via WebSocket gateway after each step
- Saves downloaded file reference to the DB
- Updates job status in DB on completion/failure

### 3. WebSocket Gateway (`progress.gateway.ts`)
- Namespace: `/progress`
- Event: `job:progress` - emitted after each step executes
  ```json
  {
    "jobId": 1,
    "stepIndex": 2,
    "stepDescription": "Clicking download button",
    "status": "success" | "error",
    "message": "...",
    "totalSteps": 5
  }
  ```
- Event: `job:status` - emitted when overall job status changes

### 4. DownloadsModule
- **GET /downloads** - List downloaded files
- **GET /downloads/:id/file** - Serve/stream the file

---

## Frontend Pages & Components

### 1. Jobs List Page (`/jobs`)
- PrimeNG DataTable with all jobs
- Columns: Name, Target URL, Status, Last Run, Actions
- Status badge (colored by JobStatus)
- Actions: Edit, Run, Delete, View Progress

### 2. Job Editor Page (`/jobs/new`, `/jobs/:id/edit`)
- Form: Name, Description, Target URL, Download Path, Cron
- **Step Builder** - visual drag-and-drop ordered list of steps
  - Add step button (opens dialog to choose step type)
  - Per step: type selector, fields for selector/value/url/timeout, description
  - Reorder steps via drag-and-drop (PrimeNG OrderList)
  - Delete step button

### 3. Job Detail / Progress Page (`/jobs/:id`)
- Job info summary
- Real-time progress feed via WebSocket
  - List of steps with status icons (pending / running / done / error)
  - Progress bar
  - Live log output
- History of past runs

### 4. Downloads Page (`/downloads`)
- PrimeNG DataTable of downloaded files
- Columns: Filename, Job, Size, Date, Actions (Download)

---

## NgRx Store Structure

```
AppState {
  jobs: JobsState {
    jobs: Job[]
    selectedJob: Job | null
    loading: boolean
    error: string | null
  }
  downloads: DownloadsState {
    downloads: Download[]
    loading: boolean
  }
  progress: ProgressState {
    activeJobId: number | null
    steps: ProgressStep[]     // live step updates from WebSocket
    jobStatus: JobStatus | null
  }
}
```

### NgRx Effects
- `loadJobs$` - HTTP GET /jobs
- `createJob$` - HTTP POST /jobs
- `updateJob$` - HTTP PUT /jobs/:id
- `deleteJob$` - HTTP DELETE /jobs/:id
- `runJob$` - HTTP POST /jobs/:id/run
- `listenJobProgress$` - subscribe to WebSocket events, dispatch progress actions

---

## Implementation Phases

### Phase 1 - Project Scaffolding
- [ ] Initialize NestJS backend project
- [ ] Initialize Angular frontend project
- [ ] Setup SQLite + TypeORM
- [ ] Setup Redis + BullMQ
- [ ] Setup Socket.io in NestJS
- [ ] Setup NgRx in Angular
- [ ] Setup PrimeNG

### Phase 2 - Backend Core
- [ ] Define TypeORM entities (Job, JobStep)
- [ ] Implement JobsModule (CRUD REST API)
- [ ] Implement BullMQ queue setup
- [ ] Implement BullMQ Job Processor with Puppeteer
- [ ] Implement WebSocket Gateway for progress events
- [ ] Implement DownloadsModule

### Phase 3 - Frontend Core
- [ ] Setup Angular routing
- [ ] Implement NgRx store (actions, reducers, selectors, effects)
- [ ] Implement API service
- [ ] Implement WebSocket service
- [ ] Implement Jobs List page
- [ ] Implement Job Editor with Step Builder
- [ ] Implement Job Progress page
- [ ] Implement Downloads page

### Phase 4 - Integration & Polish
- [ ] Connect WebSocket progress to NgRx store
- [ ] Error handling (backend + frontend)
- [ ] Notifications (PrimeNG Toast)
- [ ] Responsive layout (PrimeNG layout)
- [ ] Environment configuration (backend URL, Redis URL, etc.)

---

## Dependencies

### Backend (`backend/package.json`)
```json
{
  "@nestjs/core": "^10",
  "@nestjs/common": "^10",
  "@nestjs/platform-express": "^10",
  "@nestjs/platform-socket.io": "^10",
  "@nestjs/websockets": "^10",
  "@nestjs/typeorm": "^10",
  "@nestjs/bull": "^10",
  "typeorm": "^0.3",
  "better-sqlite3": "^9",
  "bullmq": "^5",
  "ioredis": "^5",
  "puppeteer": "^22",
  "class-validator": "^0.14",
  "class-transformer": "^0.5"
}
```

### Frontend (`frontend/package.json`)
```json
{
  "@angular/core": "^17",
  "primeng": "^17",
  "primeicons": "^6",
  "@ngrx/store": "^17",
  "@ngrx/effects": "^17",
  "@ngrx/entity": "^17",
  "@ngrx/devtools": "^17",
  "socket.io-client": "^4"
}
```

---

## Notes & Decisions

- **Redis** is required for BullMQ. A Docker Compose file will be provided to run Redis alongside the app.
- **Downloaded files** are saved to a configurable local directory on the server (e.g. `./downloads/`).
- **Puppeteer** will run in headless mode. The download directory will be set per-job via Puppeteer's `downloadBehavior`.
- **Cron scheduling** is optional per job, implemented via BullMQ's repeatable jobs.
- **Authentication** is out of scope for v1 (assumed to be selfhosted in a trusted network).
