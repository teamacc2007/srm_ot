using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Backend.Data;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add SQL Database (SQLite) with Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Data Source=srm_ot_scheduler.db";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(connectionString);
});

// Register Patient & Workflow Service (Scoped)
builder.Services.AddScoped<IPatientService, PatientService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// CORS configuration to allow local Angular/Vite frontends
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

// Initialize SQL database and seed initial data if needed
using (var scope = app.Services.CreateScope())
{
    var patientService = scope.ServiceProvider.GetRequiredService<IPatientService>() as PatientService;
    if (patientService != null)
    {
        await patientService.InitializeDatabaseAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");

// Serve Angular 22 SPA from dist folder
var distPath = Path.Combine(app.Environment.ContentRootPath, "..", "dist");
if (Directory.Exists(distPath))
{
    var fileProvider = new PhysicalFileProvider(Path.GetFullPath(distPath));
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = fileProvider,
        RequestPath = ""
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = fileProvider,
        RequestPath = ""
    });

    app.UseRouting();
    app.UseAuthorization();
    app.MapControllers();

    app.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = fileProvider
    });
}
else
{
    app.UseRouting();
    app.UseAuthorization();
    app.MapControllers();
}

app.Run();
