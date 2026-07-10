using LichSuDang.Api.Data;
using LichSuDang.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) => _db = db;

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
