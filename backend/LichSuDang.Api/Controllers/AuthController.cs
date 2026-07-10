using System.Security.Claims;
using Google.Apis.Auth;
using LichSuDang.Api.Data;
using LichSuDang.Api.Domain;
using LichSuDang.Api.Dtos;
using LichSuDang.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;
    private readonly IConfiguration _cfg;
    public AuthController(AppDbContext db, JwtTokenService jwt, IConfiguration cfg) { _db = db; _jwt = jwt; _cfg = cfg; }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Tài khoản và mật khẩu không được để trống" });
        if (await _db.Users.AnyAsync(u => u.Username == req.Username))
            return Conflict(new { error = "Tên đăng nhập đã tồn tại" });

        var user = new User
        {
            Username = req.Username,
            Email = req.Email,
            DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? req.Username : req.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = Role.User,
            LastLoginAt = DateTime.UtcNow,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return new AuthResponse(_jwt.Create(user), user.ToDto());
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
        // Tài khoản đăng nhập bằng Google có PasswordHash rỗng → không cho login mật khẩu
        if (user is null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Sai tài khoản hoặc mật khẩu" });

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new AuthResponse(_jwt.Create(user), user.ToDto());
    }

    // Đăng nhập bằng Google: nhận ID token từ Google Identity Services, xác thực, tìm/ tạo user.
    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> Google(GoogleLoginRequest req)
    {
        var clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? _cfg["Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            return StatusCode(500, new { error = "Server chưa cấu hình Google Client ID" });

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(req.Credential,
                new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId } });
        }
        catch
        {
            return Unauthorized(new { error = "Token Google không hợp lệ" });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject)
                   ?? await _db.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

        if (user is null)
        {
            user = new User
            {
                Username = await UniqueUsernameAsync(payload.Email),
                Email = payload.Email,
                DisplayName = string.IsNullOrWhiteSpace(payload.Name) ? payload.Email : payload.Name,
                GoogleId = payload.Subject,
                AvatarUrl = payload.Picture,
                Role = Role.User,
                LastLoginAt = DateTime.UtcNow,
            };
            _db.Users.Add(user);
        }
        else
        {
            user.GoogleId ??= payload.Subject;
            if (string.IsNullOrEmpty(user.AvatarUrl)) user.AvatarUrl = payload.Picture;
            user.LastLoginAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return new AuthResponse(_jwt.Create(user), user.ToDto());
    }

    private async Task<string> UniqueUsernameAsync(string email)
    {
        var baseName = email.Split('@')[0];
        if (string.IsNullOrWhiteSpace(baseName)) baseName = "user";
        if (baseName.Length > 40) baseName = baseName[..40];
        var name = baseName;
        var i = 1;
        while (await _db.Users.AnyAsync(u => u.Username == name)) name = $"{baseName}{i++}";
        return name;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var id = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(id);
        return user is null ? Unauthorized() : user.ToDto();
    }
}
