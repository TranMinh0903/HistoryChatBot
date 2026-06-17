using LichSuDang.Api.Data;
using LichSuDang.Api.Domain;
using LichSuDang.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[Route("api/quiz")]
public class QuizController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public QuizController(AppDbContext db) => _db = db;

    [HttpGet("questions")]
    public async Task<ActionResult<List<QuizQuestionDto>>> GetQuestions([FromQuery] int count = 10)
    {
        var all = await _db.QuizQuestions.ToListAsync();
        return all.OrderBy(_ => Guid.NewGuid()).Take(Math.Clamp(count, 1, 50))
            .Select(q => q.ToDto()).ToList();
    }

    [HttpPost("attempts")]
    public async Task<ActionResult<QuizResultDto>> Submit(SubmitAttemptRequest req)
    {
        var ids = req.Answers.Select(a => a.QuestionId).ToList();
        var questions = await _db.QuizQuestions.Where(q => ids.Contains(q.Id)).ToDictionaryAsync(q => q.Id);

        var items = new List<QuizResultItemDto>();
        var attempt = new QuizAttempt
        {
            UserId = UserId,
            StartedAt = req.StartedAt == default ? DateTime.UtcNow : req.StartedAt.ToUniversalTime(),
        };

        foreach (var a in req.Answers)
        {
            if (!questions.TryGetValue(a.QuestionId, out var q)) continue;
            var correct = string.Equals(a.SelectedOption, q.CorrectOption, StringComparison.OrdinalIgnoreCase);
            attempt.Answers.Add(new QuizAttemptAnswer { QuestionId = q.Id, SelectedOption = a.SelectedOption, IsCorrect = correct });
            items.Add(new QuizResultItemDto(q.Id, a.SelectedOption, q.CorrectOption, correct, q.Explanation));
        }

        attempt.TotalQuestions = items.Count;
        attempt.CorrectCount = items.Count(i => i.IsCorrect);
        attempt.Score = items.Count == 0 ? 0 : (int)Math.Round(attempt.CorrectCount * 100.0 / items.Count);
        attempt.FinishedAt = DateTime.UtcNow;
        attempt.DurationSeconds = Math.Max(1, (int)(attempt.FinishedAt - attempt.StartedAt).TotalSeconds);

        _db.QuizAttempts.Add(attempt);
        await _db.SaveChangesAsync();

        return new QuizResultDto(attempt.Id, attempt.TotalQuestions, attempt.CorrectCount,
            attempt.Score, attempt.DurationSeconds ?? 0, items);
    }

    [HttpGet("attempts")]
    public async Task<ActionResult<List<QuizAttemptSummaryDto>>> GetAttempts()
    {
        return await _db.QuizAttempts
            .Where(a => a.UserId == UserId)
            .OrderByDescending(a => a.FinishedAt)
            .Select(a => new QuizAttemptSummaryDto(a.Id, a.Score, a.CorrectCount, a.TotalQuestions, a.FinishedAt))
            .ToListAsync();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("leaderboard")]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> Leaderboard([FromQuery] int limit = 10)
    {
        // Group theo UserId (scalar) để EF dịch được sang SQL, rồi lấy tên hiển thị riêng.
        var top = await _db.QuizAttempts
            .GroupBy(a => a.UserId)
            .Select(g => new { UserId = g.Key, BestScore = g.Max(x => x.Score), Attempts = g.Count() })
            .OrderByDescending(x => x.BestScore)
            .Take(Math.Clamp(limit, 1, 100))
            .ToListAsync();

        var ids = top.Select(t => t.UserId).ToList();
        var names = await _db.Users.Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.DisplayName);

        return top
            .Select(t => new LeaderboardEntryDto(
                t.UserId, names.TryGetValue(t.UserId, out var n) ? n : "Ẩn danh", t.BestScore, t.Attempts))
            .ToList();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("questions")]
    public async Task<ActionResult<QuizQuestionDto>> Create(CreateQuestionRequest req)
    {
        var q = new QuizQuestion
        {
            Question = req.Question, OptionA = req.OptionA, OptionB = req.OptionB,
            OptionC = req.OptionC, OptionD = req.OptionD, CorrectOption = req.CorrectOption.ToUpperInvariant(),
            Explanation = req.Explanation, Difficulty = req.Difficulty, Topic = req.Topic, Period = req.Period,
        };
        _db.QuizQuestions.Add(q);
        await _db.SaveChangesAsync();
        return q.ToDto();
    }
}
