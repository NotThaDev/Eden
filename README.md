<div align="center">

<img src="docs/assets/logo.svg" alt="Eden logo" width="96" height="96" />

# Eden

**Volunteer organization management system.**
Members, beneficiaries, distributions, and scheduled events in one place.

[![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Angular Material](https://img.shields.io/badge/Angular_Material-21-3F51B5?logo=angular&logoColor=white)](https://material.angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Bun](https://img.shields.io/badge/Bun-1.1+-000000?logo=bun&logoColor=white)](https://bun.sh/)

[Features](#-features) · [Roles](#-roles) · [Getting Started](#getting-started) · [Project Structure](#project-structure)

</div>

---

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 👥 | **Member management** | Manage the organization's volunteers |
| 📦 | **Distribution management** | Plan and track distributions to beneficiaries |
| 🏠 | **Beneficiary management** | Keep beneficiary families and their needs up to date — distribution history: [details](docs/family-history.md) |
| 📅 | **Event calendar management** | Schedule and organize events |

## 🔐 Roles

- 🛡️ **Organization administrator**
- 🚚 **Distribution manager**
- 🙋 **Member**

Different actions are available depending on the role. See [docs/AUTH.md](docs/AUTH.md) for users and the permissions table.

## Tech Stack

- **Backend**: ASP.NET Core 10 Web API + Entity Framework Core
- **Frontend**: Angular 21 with Angular Material and TailwindCSS
- **Database**: PostgreSQL 16 (containerized)
- **Package Manager**: bun for frontend, dotnet CLI for backend

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** 20+ (for Angular CLI and tooling)
- **Bun** 1.1+ (used by the process-compose workflow)
- **.NET SDK** 10.0
- **Docker** & Docker Compose
- **process-compose** ([installation guide](https://github.com/F1bonacc1/process-compose))
- **dotnet-ef** tool (for migrations):
  ```bash
  dotnet tool install --global dotnet-ef
  ```

## Getting Started

### Quick Start (Recommended)

Start all services with a single command:

```bash
process-compose up
```

This will:

1. Start Docker containers (PostgreSQL + pgAdmin)
2. Run database migrations
3. Start the backend API (http://localhost:5190)
4. Start the frontend dev server (http://localhost:4200)

### Individual Services

**Backend only:**

```bash
cd backend/Eden.Api
dotnet watch
```

**Frontend only:**

```bash
cd frontend
bun install
bun start
```

**Database only:**

```bash
docker compose up -d
```

### Database Management

**Access pgAdmin:**

- URL: http://localhost:5050
- Email: `admin@example.com`
- Password: `password`

## API Documentation

When running in development mode, Swagger UI is available at:

- http://localhost:5190

## 🧪 Tests

Backend tests live in `backend/Eden.Api.Tests` (xUnit, integration tests through HTTP). Run them from the repo root with `dotnet test Eden.sln`. They need Docker running, because Testcontainers starts a PostgreSQL 16 container. CI runs the backend and frontend checks on every pull request.

## Project Structure

```
eden/
├── backend/
│   └── Eden.Api/
│       ├── controllers/     # API endpoints
│       ├── models/          # Domain entities
│       ├── data/           # DbContext
│       ├── helpers/        # EdenAppContext singleton
│       ├── DTOs/           # Data transfer objects
│       └── Migrations/     # EF Core migrations
├── frontend/
│   └── src/
│       └── app/
│           ├── core/       # Core services (HTTP, models)
│           ├── features/   # Feature modules
│           └── shared/     # Shared components
└── docker-compose.yml      # Database containers
```

## Development Notes

- The backend uses a custom `EdenAppContext` singleton for database access
- Frontend uses standalone Angular components (no NgModules)
- CORS is configured via `appsettings.json`
- Migrations run automatically via `process-compose` before API starts
