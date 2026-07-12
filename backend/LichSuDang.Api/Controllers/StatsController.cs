using LichSuDang.Api.Data;
using LichSuDang.Api.Domain;
using LichSuDang.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[Route("api/stats")]
public class StatsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public StatsController(AppDbContext db) => _db = db;

    // Admin: số liệu toàn hệ thống. User thường: chỉ số liệu của chính mình.
    [HttpGet("overview")]
    public async Task<ActionResult<StatsOverviewDto>> Overview()
    {
        var weekAgo = DateTime.UtcNow.AddDays(-7);

        if (IsAdmin)
        {
            // Chỉ tính end-user (Role.User), KHÔNG tính tài khoản admin → khớp trang Quản lý.
            var userAttempts = _db.QuizAttempts.Where(a => a.User!.Role == Role.User);
            return new StatsOverviewDto(
                TotalUsers: await _db.Users.CountAsync(u => u.Role == Role.User),
                ActiveUsers7d: await _db.Users.CountAsync(u => u.Role == Role.User && u.LastLoginAt != null && u.LastLoginAt > weekAgo),
                TotalSessions: await _db.ChatSessions.CountAsync(s => s.User!.Role == Role.User),
                TotalUserMessages: await _db.ChatMessages.CountAsync(m => m.Role == "user" && m.Session!.User!.Role == Role.User),
                TotalQuizAttempts: await userAttempts.CountAsync(),
                AvgQuizScore: await userAttempts.AnyAsync() ? Math.Round(await userAttempts.AverageAsync(a => (double)a.Score), 1) : 0,
                TotalFlashcardReviews: await _db.FlashcardReviews.CountAsync(r => _db.Users.Any(u => u.Id == r.UserId && u.Role == Role.User)));
        }

        var uid = UserId;
        var myAttempts = _db.QuizAttempts.Where(a => a.UserId == uid);
        return new StatsOverviewDto(
            TotalUsers: 0, // không áp dụng cho user thường (frontend ẩn 2 thẻ này)
            ActiveUsers7d: 0,
            TotalSessions: await _db.ChatSessions.CountAsync(s => s.UserId == uid),
            TotalUserMessages: await _db.ChatMessages.CountAsync(m => m.Role == "user" && m.Session!.UserId == uid),
            TotalQuizAttempts: await myAttempts.CountAsync(),
            AvgQuizScore: await myAttempts.AnyAsync() ? Math.Round(await myAttempts.AverageAsync(a => (double)a.Score), 1) : 0,
            TotalFlashcardReviews: await _db.FlashcardReviews.CountAsync(r => r.UserId == uid));
    }

    [HttpGet("activity")]
    public async Task<ActionResult<StatsActivityDto>> Activity([FromQuery] int days = 30)
    {
        days = Math.Clamp(days, 1, 365);
        var from = DateTime.UtcNow.Date.AddDays(-(days - 1));

        if (IsAdmin)
        {
            var msgRaw = await _db.ChatMessages.Where(m => m.CreatedAt >= from && m.Session!.User!.Role == Role.User)
                .GroupBy(m => m.CreatedAt.Date).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();
            var userRaw = await _db.Users.Where(u => u.Role == Role.User && u.CreatedAt >= from)
                .GroupBy(u => u.CreatedAt.Date).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();
            return new StatsActivityDto(
                FillDays(from, days, msgRaw.ToDictionary(x => x.Key, x => x.Count)),
                FillDays(from, days, userRaw.ToDictionary(x => x.Key, x => x.Count)));
        }

        var uid = UserId;
        var myMsg = await _db.ChatMessages
            .Where(m => m.CreatedAt >= from && m.Role == "user" && m.Session!.UserId == uid)
            .GroupBy(m => m.CreatedAt.Date).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();
        // user thường không có "người dùng mới" → trả mảng rỗng (frontend ẩn biểu đồ đó)
        return new StatsActivityDto(
            FillDays(from, days, myMsg.ToDictionary(x => x.Key, x => x.Count)),
            new List<DayCountDto>());
    }

    [HttpGet("quiz")]
    public async Task<ActionResult<StatsQuizDto>> Quiz([FromQuery] int days = 30)
    {
        days = Math.Clamp(days, 1, 365);
        var from = DateTime.UtcNow.Date.AddDays(-(days - 1));

        // Admin: chỉ lượt của end-user (loại admin). User thường: chỉ của mình.
        var query = IsAdmin
            ? _db.QuizAttempts.Where(a => a.User!.Role == Role.User)
            : _db.QuizAttempts.Where(a => a.UserId == UserId);
        var attempts = await query.ToListAsync();

        string Bucket(int s) => s <= 20 ? "0–20" : s <= 40 ? "21–40" : s <= 60 ? "41–60" : s <= 80 ? "61–80" : "81–100";
        var buckets = new[] { "0–20", "21–40", "41–60", "61–80", "81–100" };
        var dist = buckets.Select(b => new ScoreBucketDto(b, attempts.Count(a => Bucket(a.Score) == b))).ToList();

        var perDay = attempts.Where(a => a.FinishedAt >= from)
            .GroupBy(a => a.FinishedAt.Date).ToDictionary(g => g.Key, g => g.Count());

        // Hoạt động học THẬT theo giai đoạn: câu quiz đã trả lời + flashcard đã ôn, gộp theo mốc năm.
        // (Trước đây frontend bịa số từ bộ đề seed → account mới cũng có cột. Giờ lấy dữ liệu thật.)
        var periods = new[] { "1954", "1960", "1968", "1975" };
        var ansBase = IsAdmin
            ? _db.QuizAttemptAnswers.Where(a => a.Attempt!.User!.Role == Role.User)
            : _db.QuizAttemptAnswers.Where(a => a.Attempt!.UserId == UserId);
        var answerPeriods = await (from ans in ansBase
                                   join qq in _db.QuizQuestions on ans.QuestionId equals qq.Id
                                   where qq.Period != null
                                   select qq.Period!).ToListAsync();
        var revBase = IsAdmin
            ? _db.FlashcardReviews.Where(r => _db.Users.Any(u => u.Id == r.UserId && u.Role == Role.User))
            : _db.FlashcardReviews.Where(r => r.UserId == UserId);
        var reviewPeriods = await (from r in revBase
                                   join f in _db.Flashcards on r.FlashcardId equals f.Id
                                   where f.Period != null
                                   select f.Period!).ToListAsync();
        var studyRaw = answerPeriods.Concat(reviewPeriods).ToList();
        var studyByPeriod = periods
            .Select(p => new PeriodCountDto(p, studyRaw.Count(x => x.Contains(p))))
            .ToList();

        return new StatsQuizDto(
            dist,
            FillDays(from, days, perDay),
            attempts.Count == 0 ? 0 : Math.Round(attempts.Average(a => (double)a.Score), 1),
            attempts.Count == 0 ? 0 : attempts.Max(a => a.Score),
            studyByPeriod);
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
