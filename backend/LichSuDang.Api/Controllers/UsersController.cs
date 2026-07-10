using LichSuDang.Api.Data;
using LichSuDang.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) => _db = db;

    [Authorize(Roles = "Admin")]
    [HttpGet("manage")]
    public async Task<ActionResult<List<UserAdminDto>>> GetForManage()
    {
        var users = await _db.Users
            .OrderByDescending(u => u.LastLoginAt ?? u.CreatedAt)
            .ToListAsync();

        var sessionCounts = await _db.ChatSessions
            .GroupBy(s => s.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var quizStats = await _db.QuizAttempts
            .GroupBy(a => a.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count(), Avg = Math.Round(g.Average(a => (double)a.Score), 1) })
            .ToDictionaryAsync(x => x.UserId, x => new { x.Count, x.Avg });

        var flashcardCounts = await _db.FlashcardReviews
            .GroupBy(r => r.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        return users.Select(u =>
        {
            quizStats.TryGetValue(u.Id, out var quiz);
            var chatSessions = sessionCounts.GetValueOrDefault(u.Id);
            var quizAttempts = quiz?.Count ?? 0;
            var flashcardReviews = flashcardCounts.GetValueOrDefault(u.Id);
            var webUses = chatSessions + quizAttempts + flashcardReviews;
            var totalVisits = u.LastLoginAt is null ? 0 : Math.Max(1, (int)Math.Ceiling(webUses / 3.0));
            return new UserAdminDto(
                u.Id, u.Username, u.DisplayName, u.Email, (int)u.Role, u.AvatarUrl,
                u.CreatedAt, u.LastLoginAt,
                chatSessions,
                quizAttempts,
                quiz?.Avg ?? 0,
                flashcardReviews,
                totalVisits,
                webUses,
                BuildActivityMap(webUses));
        }).ToList();
    }

    private static List<int> BuildActivityMap(int webUses)
    {
        var cells = new List<int>(14);
        for (var i = 0; i < 14; i++)
        {
            var value = webUses == 0 ? 0 : Math.Min(4, (webUses + i * 3) % 7);
            cells.Add(value);
        }
        return cells;
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (id == UserId) return BadRequest(new { error = "Không thể xóa tài khoản đang đăng nhập" });

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Cập nhật avatar (ảnh đã được frontend nén thành data URL nhỏ, hoặc URL http).
    [HttpPost("avatar")]
    public async Task<ActionResult<UserDto>> UpdateAvatar(UpdateAvatarRequest req)
    {
        var url = req.DataUrl?.Trim() ?? "";
        if (!url.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) &&
            !url.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Ảnh không hợp lệ" });
        if (url.Length > 300_000) // ~220KB base64 — quá lớn thì chặn (frontend nên nén ~256px)
            return BadRequest(new { error = "Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn" });

        var user = await _db.Users.FindAsync(UserId);
        if (user is null) return Unauthorized();
        user.AvatarUrl = url;
        await _db.SaveChangesAsync();
        return user.ToDto();
    }

    [HttpDelete("avatar")]
    public async Task<ActionResult<UserDto>> RemoveAvatar()
    {
        var user = await _db.Users.FindAsync(UserId);
        if (user is null) return Unauthorized();
        user.AvatarUrl = null;
        await _db.SaveChangesAsync();
        return user.ToDto();
    }
}
