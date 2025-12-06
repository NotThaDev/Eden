using Eden.Api.Data;
using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add Swagger/OpenAPI services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS with a named policy
const string AllowOriginsPolicy = "_allowOriginsPolicy";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("PostgresConnection");
    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException("Postgres connection string is not configured.");
    }

    options.UseNpgsql(connectionString);
});

var app = builder.Build();

EdenAppContext.Initialize(app);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Eden API V1");
        c.RoutePrefix = string.Empty; // Serve at root if desired
    });
}

app.UseHttpsRedirection();
app.UseCors(AllowOriginsPolicy);
app.UseAuthorization();
app.MapControllers();

try
{
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Unhandled exception: {ex.Message}");
    throw;
}