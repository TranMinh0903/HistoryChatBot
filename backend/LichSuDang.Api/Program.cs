using System.Text;
using LichSuDang.Api.Data;
using LichSuDang.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Pgvector.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

// Railway/Render cấp cổng qua biến môi trường PORT → app lắng nghe đúng cổng đó.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port)) builder.WebHost.UseUrls($"http://+:{port}");

// ----- Database -----
// Ưu tiên DATABASE_URL (Railway/Render/Neon cấp dạng postgres://user:pass@host:port/db),
// nếu không có thì dùng ConnectionStrings:Default.
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var connString = !string.IsNullOrWhiteSpace(databaseUrl)
    ? ConvertDatabaseUrl(databaseUrl)
    : (cfg.GetConnectionString("Default") ?? "Host=localhost;Database=lichsudang;Username=postgres;Password=postgres");
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connString, np => np.UseVector()));

// ----- App services -----
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddHttpClient<GroqChatService>();
builder.Services.AddHttpClient<EmbeddingService>();   // Gemini embedding cho RAG
builder.Services.AddScoped<RagService>();

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

// Chuyển postgres://user:pass@host:port/db  ->  chuỗi kết nối Npgsql (kèm SSL cho cloud).
static string ConvertDatabaseUrl(string url)
{
    var uri = new Uri(url);
    var userInfo = uri.UserInfo.Split(':', 2);
    var db = uri.AbsolutePath.TrimStart('/');
    var ssl = url.Contains("sslmode=", StringComparison.OrdinalIgnoreCase)
        ? "" : ";SSL Mode=Require;Trust Server Certificate=true";
    return $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={db};" +
           $"Username={userInfo[0]};Password={Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? "")}{ssl}";
}
