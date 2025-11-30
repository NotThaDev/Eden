using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Helpers
{
    public class EdenAppContext
    {
        private static EdenAppContext _context;

        public AppDbContext DbContext { get; private set; }
        public static EdenAppContext Context { get; }
        public static void Initialize(WebApplication App)
        {
            _context ??= new EdenAppContext();
            _context.ConfigureCors(App);
            _context.ConfigureDb(App);
        }

        private void ConfigureDb(WebApplication App)
        {
            using var scope = App.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            DbContext = db;
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