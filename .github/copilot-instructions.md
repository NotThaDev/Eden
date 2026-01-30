# Eden Project - AI Assistant Instructions

## Architecture Overview

Eden is a full-stack management application with a **.NET 10 backend** and **Angular 21 frontend**:

- **Backend**: ASP.NET Core Web API using Entity Framework Core with PostgreSQL
- **Frontend**: Angular 21 with Angular Material, TailwindCSS, and SSR support
- **Database**: PostgreSQL 16 (containerized)
- **Package Manager**: Bun for frontend, dotnet CLI for backend

### Key Components

- **Models**: `Family`, `Food`, `Load`, `LoadItem` - domain entities with unique name constraints
- **Controllers**: RESTful endpoints in `backend/Eden.Api/controllers/`
- **DbContext**: Uses custom `EdenAppContext` singleton wrapper for scoped database access
- **Frontend**: Feature-based architecture under `frontend/src/app/features/`

## Development Workflow

### Starting the Application

Use `process-compose` to orchestrate all services:

```bash
process-compose up
```

This starts:
1. Docker containers (PostgreSQL + pgAdmin)
2. Frontend dev server (http://localhost:4200, uses Bun)
3. Backend API with hot reload (http://localhost:5190)

### Individual Services

**Backend only:**
```bash
cd backend/Eden.Api
dotnet watch
```

**Frontend only:**
```bash
cd frontend
bun start
```

**Database only:**
```bash
docker compose up -d
```

### Database Management

**Create Migration:**
```bash
cd backend/Eden.Api
dotnet ef migrations add <migration_name>
```

**Apply Migrations:**
Migrations run automatically on startup via EF Core.

**Database Access:**
- **Connection String**: `Host=db;Port=5432;Database=eden;Username=user;Password=password`
- **pgAdmin**: http://localhost:5050 (admin@example.com / password)

## Critical Patterns & Conventions

### Backend: EdenAppContext Pattern

**DO NOT** inject `AppDbContext` directly into controllers. Instead, use the `EdenAppContext` singleton:

```csharp
// ✅ Correct - in Model methods
await EdenAppContext.Context.WithDbContext(db => 
    db.Foods.Where(f => f.Id == id).FirstOrDefaultAsync()
);

// ❌ Incorrect - in Controllers
public FoodController(AppDbContext context) { } // Don't do this
```

**Why**: `EdenAppContext` provides centralized scope management and CORS configuration. It's initialized once in [Program.cs](backend/Eden.Api/Program.cs#L27) and accessed via static singleton.

### Backend: Model-Centric Logic

Business logic lives in **model classes**, not controllers. Controllers are thin orchestrators:

```csharp
// Models contain static async methods for data access
public static Task<List<Food>> GetFoodsAsync() { ... }
public static Task<Food?> GetFoodByIdAsync(int id) { ... }
public static async Task<Food?> AddFood(Food food) { ... }
```

See [Food.cs](backend/Eden.Api/models/Food.cs) for reference implementation.

### Backend: Validation Pattern

Private controller methods handle validation:

```csharp
private IActionResult? _validateFoodRequest(Food food)
{
    if (food.Quantity < 0) return BadRequest("...");
    // ... more validation
    return null; // null means valid
}
```

### Frontend: HttpHandler Service

**Never use `HttpClient` directly**. Use `HttpHandler` from [httpHandler.ts](frontend/src/app/core/http/httpHandler.ts):

```typescript
constructor(private httpHandler: HttpHandler) {}

// Automatically prefixes with apiUrl (http://localhost:5190)
this.httpHandler.get<Food[]>('/api/food');
```

### Frontend: File Naming

- **Components**: `kebab-case.ts` (e.g., `main-layout.ts`)
- **No `.component` suffix** - files are named directly (e.g., `app.ts` not `app.component.ts`)

## Entity Framework Conventions

- **Primary Keys**: Nullable `int? Id` (auto-generated)
- **Timestamps**: `CreatedAt` with `DatabaseGenerated` attribute + DB default `NOW()`
- **Unique Constraints**: Use `[Index(nameof(Name), IsUnique = true)]` attribute
- **Foreign Keys**: Explicitly configured in `OnModelCreating` (see [AppDbContext.cs](backend/Eden.Api/data/AppDbContext.cs#L15-L19))
- **Delete Behavior**: `DeleteBehavior.SetNull` for nullable FKs

## Configuration

- **Backend**: [appsettings.json](backend/Eden.Api/appsettings.json) - Connection strings, CORS origins
- **Frontend**: API URL hardcoded in `HttpHandler` (TODO: move to environment files)
- **CORS**: Configured in `EdenAppContext.ConfigureCors()` from appsettings

## Tech Stack Details

- **.NET 10.0** with nullable reference types enabled
- **Angular 21** with standalone components (no NgModules)
- **Angular Material 21** + Luxon date adapter
- **Bun** runtime for frontend (not npm/node)
- **Swagger UI**: Available at http://localhost:5190 in development

## Common Tasks

**Add new entity:**
1. Create model in `backend/Eden.Api/models/`
2. Add `DbSet<T>` to `AppDbContext`
3. Create controller in `controllers/`
4. Generate migration: `dotnet ef migrations add create_<entity>_table`

**Add new API endpoint:**
- Keep validation in private controller methods
- Keep data access in model static methods
- Return appropriate HTTP status codes (Ok, NotFound, BadRequest, Conflict)
