using System.Security.Claims;
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
    public AuthController(AppDbContext db, JwtTokenService jwt) { _db = db; _jwt = jwt; }

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
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Sai tài khoản hoặc mật khẩu" });

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new AuthResponse(_jwt.Create(user), user.ToDto());
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
