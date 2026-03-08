using System.Text;
using System.Text.Json.Serialization;
using Betkibans.Server.Data;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Models;
using Betkibans.Server.Repositories;
using Betkibans.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------
// 1) Database (PostgreSQL)
// ----------------------------
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ----------------------------
// 2) Identity
// ----------------------------
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// ----------------------------
// 3) JWT Authentication
// ----------------------------
var secret = builder.Configuration["JwtConfig:Secret"];
if (string.IsNullOrWhiteSpace(secret))
{
    throw new InvalidOperationException("JwtConfig:Secret is missing in appsettings.json");
}

var key = Encoding.ASCII.GetBytes(secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;

    // For local development 
    options.RequireHttpsMetadata = false;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// ----------------------------
// 4) Controllers + JSON
// ----------------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Prevent JSON cycles (EF navigation properties etc.)
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// ----------------------------
// 5) Swagger
// ----------------------------
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    // Prevent schema name collisions (DTO vs Entity with same class name)
    c.CustomSchemaIds(t => t.FullName);

    // Prevent Swagger crash if accidentally have route conflicts
    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());

    // Support file upload endpoints (IFormFile)
    c.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });

    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());

    // Support DateOnly/TimeOnly if used them in DTOs
    c.MapType<DateOnly>(() => new OpenApiSchema { Type = "string", Format = "date" });
    c.MapType<TimeOnly>(() => new OpenApiSchema { Type = "string", Format = "time" });

    // Optional: JWT support in Swagger "Authorize" button
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ----------------------------
// 6) CORS (React)
// ----------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ----------------------------
// 7) DI registrations
// ----------------------------
// Register Repositories
builder.Services.AddScoped<Betkibans.Server.Interfaces.IProductRepository,
    Betkibans.Server.Repositories.ProductRepository>();

builder.Services.AddScoped<Betkibans.Server.Interfaces.ISellerRepository,
    Betkibans.Server.Repositories.SellerRepository>();

// Register Services
builder.Services.AddScoped<Betkibans.Server.Interfaces.IProductService,
    Betkibans.Server.Services.ProductService>();

builder.Services.AddScoped<Betkibans.Server.Interfaces.ISellerService,
    Betkibans.Server.Services.SellerService>();

builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();

builder.Services.AddScoped<IMaterialRepository, MaterialRepository>();
builder.Services.AddScoped<IMaterialService, MaterialService>();

builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<ICartService, CartService>();

builder.Services.AddHttpClient();
var app = builder.Build();

// ----------------------------
// Dev exception page + request exception logging
// ----------------------------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine("UNHANDLED EXCEPTION:");
        Console.WriteLine(ex);
        throw;
    }
});

// ----------------------------
// Seed DB (roles/admin)
// ----------------------------
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();

        // If you're using migrations, prefer: context.Database.Migrate();
        // EnsureCreated is ok for dev/prototypes.
        context.Database.EnsureCreated();

        await DbSeeder.SeedRolesAndAdminAsync(services);
    }
    catch (Exception ex)
    {
        Console.WriteLine($" Error seeding DB: {ex}");
    }
}

// ----------------------------
// Swagger UI
// ----------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ----------------------------
// Middleware order (important)
// ----------------------------
app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
