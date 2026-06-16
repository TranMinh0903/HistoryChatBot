using LichSuDang.Api.Data;
using LichSuDang.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[Route("api/stats")]
public class StatsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public StatsController(AppDbContext db) => _db = db;

    [HttpGet("overview")]
    public async Task<ActionResult<StatsOverviewDto>> Overview()
    {
        var weekAgo = DateTime.UtcNow.AddDays(-7);
        return new StatsOverviewDto(
            TotalUsers: await _db.Users.CountAsync(),
            ActiveUsers7d: await _db.Users.CountAsync(u => u.LastLoginAt != null && u.LastLoginAt > weekAgo),
            TotalSessions: await _db.ChatSessions.CountAsync(),
            TotalUserMessages: await _db.ChatMessages.CountAsync(m => m.Role == "user"),
            TotalQuizAttempts: await _db.QuizAttempts.CountAsync(),
            AvgQuizScore: await _db.QuizAttempts.AnyAsync() ? Math.Round(await _db.QuizAttempts.AverageAsync(a => (double)a.Score), 1) : 0,
            TotalFlashcardReviews: await _db.FlashcardReviews.CountAsync());
    }

    [HttpGet("activity")]
    public async Task<ActionResult<StatsActivityDto>> Activity([FromQuery] int days = 30)
    {
        days = Math.Clamp(days, 1, 365);
        var from = DateTime.UtcNow.Date.AddDays(-(days - 1));

        var msgRaw = await _db.ChatMessages.Where(m => m.CreatedAt >= from)
            .GroupBy(m => m.CreatedAt.Date)
            .Select(g => new { g.Key, Count = g.Count() }).ToListAsync();
        var userRaw = await _db.Users.Where(u => u.CreatedAt >= from)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

        return new StatsActivityDto(
            FillDays(from, days, msgRaw.ToDictionary(x => x.Key, x => x.Count)),
            FillDays(from, days, userRaw.ToDictionary(x => x.Key, x => x.Count)));
    }

    [HttpGet("quiz")]
    public async Task<ActionResult<StatsQuizDto>> Quiz([FromQuery] int days = 30)
    {
        days = Math.Clamp(days, 1, 365);
        var from = DateTime.UtcNow.Date.AddDays(-(days - 1));
        var attempts = await _db.QuizAttempts.ToListAsync();

        string Bucket(int s) => s <= 20 ? "0–20" : s <= 40 ? "21–40" : s <= 60 ? "41–60" : s <= 80 ? "61–80" : "81–100";
        var buckets = new[] { "0–20", "21–40", "41–60", "61–80", "81–100" };
        var dist = buckets.Select(b => new ScoreBucketDto(b, attempts.Count(a => Bucket(a.Score) == b))).ToList();

        var perDay = attempts.Where(a => a.FinishedAt >= from)
            .GroupBy(a => a.FinishedAt.Date).ToDictionary(g => g.Key, g => g.Count());

        return new StatsQuizDto(
            dist,
            FillDays(from, days, perDay),
            attempts.Count == 0 ? 0 : Math.Round(attempts.Average(a => (double)a.Score), 1),
            attempts.Count == 0 ? 0 : attempts.Max(a => a.Score));
    }

    private static List<DayCountDto> FillDays(DateTime from, int days, Dictionary<DateTime, int> data)
    {
        var list = new List<DayCountDto>(days);
        for (var i = 0; i < days; i++)
        {
            var d = from.AddDays(i).Date;
            list.Add(new DayCountDto(d.ToString("yyyy-MM-dd"), data.TryGetValue(d, out var c) ? c : 0));
        }
        return list;
    }
}
