using System.Text;
using LichSuDang.Api.Data;
using LichSuDang.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

// Railway/Render cấp cổng qua biến môi trường PORT → app lắng nghe đúng cổng đó.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port)) builder.WebHost.UseUrls($"http://+:{port}");

// ----- Database -----
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(cfg.GetConnectionString("Default")
        ?? "Host=localhost;Database=lichsudang;Username=postgres;Password=postgres"));

// ----- App services -----
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddHttpClient<GroqChatService>();

// ----- Auth (JWT) -----
var jwtKey = cfg["Jwt:Key"] ?? "dev-only-secret-key-change-me-please-32-characters";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = cfg["Jwt:Issuer"] ?? "LichSuDang",
            ValidAudience = cfg["Jwt:Audience"] ?? "LichSuDang",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });
builder.Services.AddAuthorization();

// ----- CORS (cho frontend Vite) -----
const string CorsPolicy = "frontend";
// Origin cho phép đọc từ config "Cors:Origins" (env Cors__Origins="https://app.vercel.app"), phân tách bằng dấu phẩy.
var corsOrigins = (cfg["Cors:Origins"] ?? "http://localhost:5173,http://localhost:4173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p =>
    p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    // Nút "Authorize" để nhập JWT (chỉ cần dán token, không cần gõ chữ "Bearer")
    o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Dán JWT token lấy từ /api/auth/login (không cần thêm chữ 'Bearer ').",
    });
    o.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", doc), new List<string>() }
    });
});

var app = builder.Build();

// ----- Migrate + seed dữ liệu -----
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
