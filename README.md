# PB Downloader

PB Downloader is a full-stack web application for automating file downloads via configurable browser workflows. You define a **Downloader** — a named rule with a URL pattern and a sequence of steps (click, fill in a form field, trigger a download) — and then submit any matching URL as a **Job**. The app launches a headless Chromium browser (Puppeteer), executes the steps, downloads the file, and makes it available for retrieval. Job progress is streamed in real time over WebSocket.

---

## Table of Contents

- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Running the Application](#running-the-application)
  - [Docker (recommended)](#docker-recommended)
  - [Node.js (local development)](#nodejs-local-development)
- [How to Use](#how-to-use)
- [Environment Variables](#environment-variables)
- [REST API](#rest-api)
- [WebSocket Events](#websocket-events)
- [Data Model](#data-model)
- [Development Commands](#development-commands)

---

## Technologies

### Backend

| Technology | Purpose |
|------------|---------|
| **NestJS 11** | REST API framework, dependency injection, modules |
| **TypeORM** | ORM for database access, entity definitions |
| **SQLite** (`better-sqlite3`) | Embedded database — no external DB server needed |
| **BullMQ** | Redis-backed job queue for processing downloads |
| **Puppeteer** | Headless Chromium automation for executing download workflows |
| **Socket.io** | WebSocket server for real-time job progress events |

### Frontend

| Technology | Purpose |
|------------|---------|
| **Angular 21** | SPA framework, standalone components, lazy routing |
| **NgRx** | Reactive state management (store, effects, entity adapters) |
| **PrimeNG** | UI component library |
| **socket.io-client** | WebSocket client for receiving real-time updates |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Redis** | BullMQ message broker |
| **Docker / docker-compose** | Containerised deployment |
| **nginx** | Serves the Angular SPA and proxies API requests |

---

## Project Structure

```
pbdownloader/
├── backend/      # NestJS API server
├── frontend/     # Angular SPA
└── docker-compose.yml
```

---

## Running the Application

### Docker (recommended)

Requires: **Docker** and **Docker Compose**

```bash
# Clone the repository
git clone <repo-url>
cd pbdownloader

# Build and start all services (frontend, backend, redis)
docker-compose up --build
```

The application will be available at `http://localhost:80`.

To run in detached (background) mode:

```bash
docker-compose up --build -d
```

To run on a different host port, build the image first and then use `docker run -p`:

```bash
docker build -t pbdownloader .
docker run -p 8080:80 pbdownloader
```

The app will then be available at `http://localhost:8080`.

#### Persistent storage (volumes)

By default, the database and downloaded files are stored inside the container and will be lost when it is removed. To persist them on the host machine, mount local directories using `-v`:

| Container path | Contents |
|----------------|----------|
| `/app/data` | SQLite database |
| `/app/downloads` | Downloaded files |

```bash
# docker run
docker run -p 80:80 \
  -v /your/local/data:/app/data \
  -v /your/local/downloads:/app/downloads \
  raiper34/pbdownloader
```

```yaml
# docker-compose.yml
services:
  app:
    image: raiper34/pbdownloader
    ports:
      - "80:80"
    volumes:
      - /your/local/data:/app/data
      - /your/local/downloads:/app/downloads
```

### Node.js (local development)

Requires: **Node.js 20+**, **npm**, and a running **Redis** instance (e.g. `docker run -p 6379:6379 redis`)

**1. Start the backend** (port 3000):

```bash
cd backend
npm install
npm run start:dev
```

**2. Start the frontend** (port 4200, proxies `/api` and `/socket.io` to the backend):

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200` in your browser.

---

## How to Use

### 1. Create a Downloader

Navigate to the **Downloaders** page (`/downloaders`) and click **New Downloader**.

Fill in:
- **Name** — a human-readable label (e.g. `My File Portal`)
- **URL Pattern** — a regular expression that matches the URLs this downloader handles (e.g. `https://example\.com/files/.*`)
- **Description** (optional)

Then add **Steps** that the browser will execute in order:

| Step type | What it does |
|-----------|-------------|
| `CLICK` | Clicks the element matching the CSS selector |
| `FILL` | Types the given value into the element matching the selector |
| `DOWNLOAD` | Clicks the element and waits for the browser to start a download |

Save the downloader.

### 2. Start a Download Job

Go to the **Download** page (`/`), paste a URL that matches a downloader's URL pattern, and click **Download**.

The app will:
1. Match the URL to a downloader
2. Queue a job in BullMQ
3. Launch a headless browser, execute the configured steps, and download the file
4. Stream progress in real time via WebSocket

### 3. Retrieve the File

Once the job status changes to **DONE**, a download link appears. The file is served from the backend at `/api/files/:filename`.

---

## Environment Variables

Configure the backend via environment variables (can be set in `docker-compose.yml` or a `.env` file):

| Variable         | Default              | Description                    |
|------------------|----------------------|--------------------------------|
| `DB_PATH`        | `./data/db.sqlite`   | Path to the SQLite database file |
| `DOWNLOADS_PATH` | `./downloads`        | Directory for downloaded files |
| `REDIS_HOST`     | `localhost`          | Redis hostname                 |
| `REDIS_PORT`     | `6379`               | Redis port                     |
| `PORT`           | `3000`               | Backend HTTP port              |

---

## REST API

### Downloaders

| Method   | Path                   | Description             |
|----------|------------------------|-------------------------|
| `GET`    | `/api/downloaders`     | List all downloaders    |
| `GET`    | `/api/downloaders/:id` | Get a downloader by ID  |
| `POST`   | `/api/downloaders`     | Create a new downloader |
| `PUT`    | `/api/downloaders/:id` | Update a downloader     |
| `DELETE` | `/api/downloaders/:id` | Delete a downloader     |

### Jobs

| Method | Path            | Description              |
|--------|-----------------|--------------------------|
| `POST` | `/api/jobs`     | Start a new download job |
| `GET`  | `/api/jobs`     | List all jobs            |
| `GET`  | `/api/jobs/:id` | Get a job by ID          |

### Files

| Method | Path                   | Description               |
|--------|------------------------|---------------------------|
| `GET`  | `/api/files/:filename` | Download a completed file |

---

## WebSocket Events

Namespace: `/jobs`

| Event          | Description                                              |
|----------------|----------------------------------------------------------|
| `job:created`  | A new job was added to the queue                         |
| `job:updated`  | Job status changed (`PENDING` / `RUNNING` / `DONE` / `FAILED`) |
| `job:progress` | Download progress update (bytes received)                |

---

## Data Model

```
Downloader { id, name, urlPattern (regex), description?, createdAt, updatedAt, steps: Step[] }
Step       { id, order, type: StepType (CLICK|FILL|DOWNLOAD), selector, value?, downloaderId }
DownloadJob{ id, url, downloaderId, status: JobStatus (PENDING|RUNNING|DONE|FAILED),
             filePath?, fileName?, errorMessage?, createdAt, updatedAt }
```

---

## Development Commands

### Backend

```bash
npm run build        # Compile TypeScript → dist/
npm run start:dev    # Dev server with watch (port 3000)
npm run start:prod   # Run compiled output
npm run lint         # ESLint with --fix
npm run format       # Prettier
npm run test         # Unit tests (Jest)
npm run test:cov     # Jest with coverage
npm run test:e2e     # E2E tests
```

### Frontend

```bash
npm run build   # ng build (production)
npm run watch   # ng build --watch (dev)
npm start       # ng serve (port 4200)
npm test        # Vitest
```
