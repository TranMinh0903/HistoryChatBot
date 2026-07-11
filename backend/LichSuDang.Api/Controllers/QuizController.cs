using System.Text.Json;
using LichSuDang.Api.Data;
using LichSuDang.Api.Domain;
using LichSuDang.Api.Dtos;
using LichSuDang.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[Route("api/quiz")]
public class QuizController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly GroqChatService _groq;
    public QuizController(AppDbContext db, GroqChatService groq) { _db = db; _groq = groq; }

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

    // Lượt làm quiz gần đây của TOÀN hệ thống — cho dashboard Admin (Get All).
    [Authorize(Roles = "Admin")]
    [HttpGet("attempts/all")]
    public async Task<ActionResult<List<QuizAttemptSummaryDto>>> GetAllAttempts([FromQuery] int limit = 20)
    {
        return await _db.QuizAttempts
            .Where(a => a.User!.Role == Role.User)
            .OrderByDescending(a => a.FinishedAt)
            .Take(Math.Clamp(limit, 1, 200))
            .Select(a => new QuizAttemptSummaryDto(a.Id, a.Score, a.CorrectCount, a.TotalQuestions, a.FinishedAt))
            .ToListAsync();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("leaderboard")]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> Leaderboard([FromQuery] int limit = 10)
    {
        // Group theo UserId (scalar) để EF dịch được sang SQL, rồi lấy tên hiển thị riêng.
        // Loại tài khoản admin khỏi bảng xếp hạng (chỉ xếp hạng end-user).
        var top = await _db.QuizAttempts
            .Where(a => a.User!.Role == Role.User)
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

    // ----- Quản lý (Admin) -----
    [Authorize(Roles = "Admin")]
    [HttpGet("questions/manage")]
    public async Task<ActionResult<List<QuizQuestionAdminDto>>> GetForManage()
    {
        return await _db.QuizQuestions
            .OrderByDescending(q => q.CreatedAt)
            .Select(q => q.ToAdminDto())
            .ToListAsync();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("questions")]
    public async Task<ActionResult<QuizQuestionAdminDto>> Create(CreateQuestionRequest req)
    {
        var q = new QuizQuestion();
        Apply(q, req);
        _db.QuizQuestions.Add(q);
        await _db.SaveChangesAsync();
        return q.ToAdminDto();
    }

    // AI tự sinh câu hỏi quiz theo chủ đề → lưu vào ngân hàng câu hỏi.
    [Authorize(Roles = "Admin")]
    [HttpPost("questions/generate")]
    public async Task<ActionResult<List<QuizQuestionAdminDto>>> Generate(GenerateQuizRequest req)
    {
        var count = Math.Clamp(req.Count, 1, 10);
        var diff = Math.Clamp(req.Difficulty, 1, 3);
        var diffLabel = diff == 1 ? "dễ" : diff == 2 ? "trung bình" : "khó";
        var topic = string.IsNullOrWhiteSpace(req.Topic) ? "Lịch sử Đảng CSVN giai đoạn 1954–1975" : req.Topic.Trim();

        const string system = "Bạn là công cụ tạo câu hỏi trắc nghiệm môn Lịch sử Đảng Cộng sản Việt Nam giai đoạn 1954–1975. " +
            "Chỉ trả về JSON hợp lệ, không kèm chữ nào khác. Nội dung chính xác về lịch sử, bằng tiếng Việt.";
        var user = $"Tạo {count} câu hỏi trắc nghiệm (độ khó {diffLabel}) về chủ đề \"{topic}\". " +
            "Mỗi câu có đúng 4 phương án A, B, C, D và 1 đáp án đúng, kèm giải thích ngắn gọn. " +
            "Trả về JSON dạng: {\"questions\":[{\"question\":\"...\",\"optionA\":\"...\",\"optionB\":\"...\",\"optionC\":\"...\",\"optionD\":\"...\",\"correctOption\":\"A\",\"explanation\":\"...\"}]}";

        var json = await _groq.CompleteJsonAsync(system, user);
        if (string.IsNullOrWhiteSpace(json))
            return BadRequest(new { error = "Chưa cấu hình GROQ_API_KEY hoặc AI không phản hồi" });

        var created = new List<QuizQuestion>();
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("questions", out var arr) || arr.ValueKind != JsonValueKind.Array)
                return BadRequest(new { error = "AI trả về dữ liệu không đúng định dạng, thử lại" });

            foreach (var q in arr.EnumerateArray())
            {
                string S(string p) => q.TryGetProperty(p, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString()! : "";
                var question = S("question");
                if (string.IsNullOrWhiteSpace(question)) continue;
                var correct = S("correctOption").Trim().ToUpperInvariant();
                var letter = correct.Length > 0 && "ABCD".Contains(correct[0]) ? correct[0].ToString() : "A";
                created.Add(new QuizQuestion
                {
                    Question = question, OptionA = S("optionA"), OptionB = S("optionB"),
                    OptionC = S("optionC"), OptionD = S("optionD"), CorrectOption = letter,
                    Explanation = S("explanation"), Difficulty = diff, Topic = topic,
                });
            }
        }
        catch
        {
            return BadRequest(new { error = "AI trả về dữ liệu không hợp lệ, thử lại" });
        }

        if (created.Count == 0) return BadRequest(new { error = "AI không tạo được câu hỏi, thử lại" });

        _db.QuizQuestions.AddRange(created);
        await _db.SaveChangesAsync();
        return created.Select(q => q.ToAdminDto()).ToList();
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("questions/{id}")]
    public async Task<IActionResult> Update(Guid id, CreateQuestionRequest req)
    {
        var q = await _db.QuizQuestions.FindAsync(id);
        if (q is null) return NotFound();
        Apply(q, req);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("questions/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var q = await _db.QuizQuestions.FindAsync(id);
        if (q is null) return NotFound();
        _db.QuizQuestions.Remove(q);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static void Apply(QuizQuestion q, CreateQuestionRequest req)
    {
        q.Question = req.Question;
        q.OptionA = req.OptionA; q.OptionB = req.OptionB; q.OptionC = req.OptionC; q.OptionD = req.OptionD;
        q.CorrectOption = req.CorrectOption.ToUpperInvariant();
        q.Explanation = req.Explanation; q.Difficulty = req.Difficulty;
        q.Topic = req.Topic; q.Period = req.Period;
    }
}
