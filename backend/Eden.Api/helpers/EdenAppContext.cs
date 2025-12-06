using Eden.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Eden.Api.Helpers
{
    public class EdenAppContext
    {
        private static EdenAppContext _context;
        private IServiceProvider _serviceProvider;

        public static EdenAppContext Context { get { return _context; } }
        public static void Initialize(WebApplication App)
        {
            _context ??= new EdenAppContext();
            _context._serviceProvider = App.Services;
            _context.ConfigureCors(App);
        }

        public async Task<T> WithDbContext<T>(Func<AppDbContext, Task<T>> action)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var queryResult = await action(dbContext);
            return queryResult;
        }


        public T WithDbContext<T>(Func<AppDbContext, T> action)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var queryResult = action(dbContext);
            return queryResult;
        }

        private void ConfigureCors(WebApplication App)
        {
            var allowedOrigins = App.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

            if (allowedOrigins == null || allowedOrigins.Length == 0)
            {
                throw new InvalidOperationException("No allowed origins configured for CORS.");
            }

            App.UseCors(policyBuilder =>
            {
                policyBuilder.WithOrigins(allowedOrigins)      // Use origins from appsettings.json
                             .AllowAnyHeader()                 // Allow all headers
                             .AllowAnyMethod()                 // Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
                             .AllowCredentials();              // Allow credentials (cookies, auth headers)
            });

            if (App.Environment.IsDevelopment())
            {
                App.UseSwagger();
                App.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MyBackend API V1");
                    c.RoutePrefix = string.Empty; // Serve at root if desired
                });
            }
        }
    }
}