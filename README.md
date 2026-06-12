# GoPass Desk App

A full-stack project management application with Kanban board, real-time collaboration, role-based access control, and an AI-powered task assistant.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Technical Decisions](#technical-decisions)
5. [AI Assistant](#ai-assistant)
6. [Data Model](#data-model)
7. [Local Installation](#local-installation)
8. [Environment Variables](#environment-variables)
9. [API Endpoints](#api-endpoints)
10. [Socket.IO Events](#socketio-events)
11. [Testing](#testing)
12. [CI/CD](#cicd)
13. [Security](#security)

---

## Overview

GoPass Desk App is a project management too. It enables teams to:

- Create and manage projects with configurable Kanban boards
- Track tasks through customizable workflows
- Collaborate in real-time with live board updates
- Receive instant notifications on task assignments, status changes, and comments
- Manage users and permissions with fine-grained access control

---

## Tech Stack

| Technology | Version
|------------|---------|---------------|
| Node.js | 20+
| TypeScript | 5.4+ 
| Express | 4.18+ 
| Prisma | 5.10+ 
| PostgreSQL | 16 
| Redis | 7 
| Socket.IO | 4.7+ 
| React | 18+ 
| Vite | 5+ 
| Tailwind CSS | 3.4+ 
| shadcn/ui | latest 
| Zustand | 4+ 
| Zod | 3.22+ 
| Jest | 29+ 
| Google Gemini 1.5 Flash | latest 

---

```mermaid
flowchart TB

    Client["React + Vite<br/>Zustand<br/>Tailwind<br/>shadcn/ui"]

    API["Express.js API Server"]

    subgraph Services
        Auth["Authentication"]
        Users["Users"]
        Projects["Projects"]
        Tasks["Tasks"]
        Status["Statuses"]
        Notifications["Notifications"]
        Admin["Administration"]
        AI["AI Integration"]
        Socket["Socket.IO"]
    end

    Prisma["Prisma ORM"]
    PostgreSQL["PostgreSQL"]
    Redis["Redis Cache"]

    Gemini["Gemini 1.5 Flash"]

    Client <-->|HTTPS / WebSocket| API

    API --> Services

    API --> Prisma
    Prisma --> PostgreSQL

    API --> Redis

    AI --> Gemini
```

### Why Layered Architecture instead of NestJS?

- **Simplicity**: NestJS adds ceremony (decorators, modules, providers) that obscures the actual logic
- **Testability**: Pure functions and explicit dependencies are easier to unit test than NestJS DI container
- **Flexibility**: No framework lock-in; can swap Express for Fastify with minimal changes
- **Senior signal**: Shows understanding of architectural patterns without hiding behind a framework

---

## Technical Decisions

### Why TypeScript and not JavaScript?
Type safety eliminates entire classes of runtime bugs. The Prisma client is auto-generated with types, making the database layer fully typed end-to-end.

### Why Functional Programming in the backend?
Controllers are implemented as arrow function properties (binding-free), services are stateless classes with injected repositories, and pure functions are preferred for business logic. This makes testing trivial — mock the repository, call the method, assert the result.

### Why Prisma and not TypeORM or Sequelize?
Prisma's query engine is type-safe by default, migrations are handled cleanly, and the schema definition acts as a single source of truth. TypeORM's decorator-based approach couples models to the ORM; Prisma keeps the schema separate.

### Why PostgreSQL and not MongoDB?
Kanban boards have strong relational data (tasks → statuses → projects → users). PostgreSQL's ACID guarantees, JSONB for notification payloads, and array support for tags make it ideal.

### Why Redis for token blacklisting and pub/sub?
Redis provides O(1) setex/get operations for token blacklisting with automatic TTL. For future scaling, Redis pub/sub can bridge multiple backend instances for Socket.IO.

### Why Socket.IO and not SSE or polling?
Socket.IO provides bidirectional communication needed for both receiving board updates and joining/leaving project rooms. SSE is unidirectional and would require a separate mechanism for the client to signal which board it's viewing.

### Why Zod for validation?
Zod schemas are shared between frontend forms (react-hook-form resolver) and backend middleware. One source of truth for validation rules.

### Why shadcn/ui and not MUI, Ant Design, or Chakra?
shadcn/ui copies components into your project — you own the code. It uses Radix UI for accessibility primitives and Tailwind for styling. No runtime dependency means no version conflicts and no bundle bloat.

### Why @hello-pangea/dnd for the Kanban?
It's the maintained fork of react-beautiful-dnd with React 18 strict mode support. Provides accessible drag-and-drop with minimal configuration.

### Why Google Gemini and Function Calling?
Gemini 1.5 Flash offers excellent price/performance for conversational tasks. **Function Calling** is the recommended AI pattern for structured data retrieval: the model receives tool declarations, decides when to query the database, and the backend executes the query with a user-scoped `AIRepository` — the model never has direct DB access. This is safer and more accurate than injecting raw data into the prompt.

---

## Data Model

```
users (id, email, password_hash, name, role, is_active)
  |
  +--< projects (owner_id)
  |
  +--< project_members (user_id) >-- projects
  |
  +--< tasks (assignee_id)
  |
  +--< tasks (reporter_id)
  |
  +--< task_comments (user_id)
  |
  +--< task_history (user_id)
  |
  +--< notifications (user_id)

projects
  |
  +--< task_statuses (project_id)
  |
  +--< tasks (project_id)

tasks
  |
  +--< subtasks (task_id)
  |
  +--< task_comments (task_id)
  |
  +--< task_history (task_id)
```

---

## Local Installation

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development without Docker)

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd gopass_desk

# Start infrastructure
docker-compose up -d

# Backend will automatically:
# 1. Run Prisma migrations
# 2. Seed admin user
# 3. Start in watch mode

# Frontend will start in watch mode

# Access:
# Frontend: http://localhost:5173
```

> Note: The Docker Compose setup builds the frontend using the `dev` stage so the Vite dev server can run inside the container and expose port `5173`.
>
> Also, Redis is mapped to host port `6382` to avoid conflicts with any local Redis instance already using `6379`.

### Backend API: http://localhost:3001
### Default login: admin@gopass.desk / MySecurePassword123!

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| DATABASE_URL | ✅ | PostgreSQL connection string | postgresql://user:pass@localhost:5432/gopass_desk |
| REDIS_URL | ✅ | Redis connection string | redis://localhost:6379 |
| JWT_ACCESS_SECRET | ✅ | Secret for access tokens 
| JWT_REFRESH_SECRET | ✅ | Secret for refresh tokens 
| JWT_ACCESS_EXPIRES_IN | ✅ | Access token TTL | 15m |
| JWT_REFRESH_EXPIRES_IN | ✅ | Refresh token TTL | 7d |
| PORT | ✅ | Backend port | 3001 |
| NODE_ENV | ✅ | Environment mode | development |
| ALLOWED_ORIGINS | ✅ | CORS whitelist | http://localhost:5173 |
| **GEMINI_API_KEY** | ⚠️ Optional | Google Gemini API key for the AI assistant. If absent, the chat widget shows a friendly unavailability message instead of an error. | AIzaSy... |

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/login | Public | Login, returns access token + sets refresh cookie |
| POST | /api/v1/auth/refresh | Public | Refresh access token via cookie |
| POST | /api/v1/auth/logout | Auth | Invalidate refresh token |
| GET | /api/v1/auth/me | Auth | Get current user |

### Users (Admin only)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/users | List all users |
| POST | /api/v1/users | Create user |
| GET | /api/v1/users/:id | Get user |
| PATCH | /api/v1/users/:id | Update user |
| DELETE | /api/v1/users/:id | Deactivate user |

### Projects
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/projects | Auth | List projects (all for admin, member for user) |
| POST | /api/v1/projects | Auth | Create project |
| GET | /api/v1/projects/:id | Auth | Get project details |
| PATCH | /api/v1/projects/:id | Auth | Update project (owner/admin) |
| DELETE | /api/v1/projects/:id | Admin | Delete project with cascade |
| POST | /api/v1/projects/:id/members | Auth | Add member |
| DELETE | /api/v1/projects/:id/members/:userId | Auth | Remove member |
| GET | /api/v1/projects/:id/stats | Auth | Get project stats |

### Tasks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/projects/:id/tasks | Auth | List tasks with filters |
| POST | /api/v1/projects/:id/tasks | Auth | Create task |
| GET | /api/v1/tasks/:taskId | Auth | Get task with all details |
| PATCH | /api/v1/tasks/:taskId | Auth | Update task |
| PATCH | /api/v1/tasks/:taskId/move | Auth | Move task (D&D) |
| DELETE | /api/v1/tasks/:taskId | Admin | Delete task |
| POST | /api/v1/tasks/:taskId/comments | Auth | Add comment |
| GET | /api/v1/tasks/:taskId/comments | Auth | List comments |
| POST | /api/v1/tasks/:taskId/subtasks | Auth | Create subtask |
| PATCH | /api/v1/tasks/:taskId/subtasks/:sid | Auth | Update subtask |
| DELETE | /api/v1/tasks/:taskId/subtasks/:sid | Auth | Delete subtask |
| GET | /api/v1/tasks/:taskId/history | Auth | Get task history |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/notifications | List notifications |
| PATCH | /api/v1/notifications/:id/read | Mark as read |
| PATCH | /api/v1/notifications/read-all | Mark all as read |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/admin/stats | Dashboard stats |

### AI Assistant
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/ai/chat | Auth | Conversational task assistant. Body: `{ messages: [{role, content}] }` |

---

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| join:project | { projectId } | Subscribe to project room |
| leave:project | { projectId } | Unsubscribe from project room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| task:moved | { taskId, fromStatusId, toStatusId, order, movedBy } | Task moved in board |
| task:updated | { taskId, projectId, changes } | Task fields updated |
| task:created | { task, projectId } | New task created |
| task:deleted | { taskId, projectId } | Task deleted |
| notification:new | { notification } | New notification for user |

---

## Testing

```bash
# Run all tests with coverage
cd backend
npm test


### Coverage
| Module | Tests |
|--------|-------|
| auth.service | Login success/failure, inactive user, refresh, blacklisted token |
| projects.service | Owner assignment, forbidden access, member deduplication |
| tasks.service | History creation, task move, authorization, notifications |
| users.service | Duplicate email, soft delete |
```
---

## CI/CD

The GitHub Actions pipeline has 4 sequential jobs:

1. **lint-and-typecheck** — ESLint + TypeScript check for both backend and frontend
2. **test** — Unit tests with Jest against PostgreSQL and Redis services
3. **build** — Docker image builds for backend and frontend
4. **deploy-mock-gke** — Push to GCR and deploy to GKE (GCP authentication via OIDC Workload Identity)

### Required GitHub Secrets
- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

---

## Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 12 rounds |
| JWT secrets | Separate secrets for access and refresh tokens |
| Token expiration | 15 min access, 7 days refresh |
| Refresh token blacklist | Redis with TTL matching token expiry |
| Rate limiting | 10 req/15min on auth, 100 req/min globally |
| HTTP security headers | Helmet.js |
| CORS | Whitelist-based from environment variable |
| Input validation | Zod schemas on all endpoints |
| PII protection | pino redact for email and name fields |
| SQL injection | Prisma parameterized queries |
| Authorization | Granular service-layer checks per resource |

---

## AI Assistant

GoPass Desk App includes a fully implemented conversational AI assistant that allows authenticated users to query their assigned tasks in natural language (Spanish).

### Features
- **Conversational** — Maintains conversation history within the session.
- **User-scoped** — Only returns data for the authenticated user; userId is always extracted from the JWT, never from the request body.
- **Function Calling** — The model uses Gemini's native Function Calling to decide when to query the database, making responses accurate and grounded in real data.
- **Graceful degradation** — If `GEMINI_API_KEY` is not set or the SDK fails, the endpoint returns `503` and the UI shows a friendly message.
- **Ephemeral** — Conversation history is stored only in client memory and destroyed when the chat panel is closed.


