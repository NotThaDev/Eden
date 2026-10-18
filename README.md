# Eden

Volunteer organization management system. Includes members, beneficiaries, and scheduled events.

## Roles

- **Organization administrator**
- **Distribution manager**
- **Member**

Different actions are available depending on the role. See [docs/AUTH.md](docs/AUTH.md) for users and the permissions table.

## Features

- **Member management**
- **Distribution management**
- **Beneficiary management**
- **Event calendar management**

Built as a full-stack web application with .NET 10 and Angular 21.

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
