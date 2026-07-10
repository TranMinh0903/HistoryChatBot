using LichSuDang.Api.Domain;

namespace LichSuDang.Api.Dtos;

// ----- Auth -----
public record RegisterRequest(string Username, string Password, string DisplayName, string? Email);
public record LoginRequest(string Username, string Password);
public record GoogleLoginRequest(string Credential);          // ID token từ Google Identity Services
public record UpdateAvatarRequest(string DataUrl);            // ảnh đã nén (data URL base64)
public record UserDto(Guid Id, string Username, string DisplayName, string? Email, int Role, string? AvatarUrl);
public record AuthResponse(string Token, UserDto User);

// ----- Chat -----
public record ChatSessionDto(Guid Id, string Title, DateTime CreatedAt, DateTime UpdatedAt);
public record ChatMessageDto(Guid Id, string Role, string Content, DateTime CreatedAt, int? TokenCount);
public record CreateSessionRequest(string? Title);
public record RenameSessionRequest(string Title);
public record SendMessageRequest(string Content);
public record SendMessageResponse(ChatMessageDto UserMessage, ChatMessageDto AssistantMessage);

// ----- Quiz -----
public record QuizQuestionDto(Guid Id, string Question, Dictionary<string, string> Options, int Difficulty, string? Topic, string? Period);
public record QuizAnswerDto(Guid QuestionId, string? SelectedOption);
public record SubmitAttemptRequest(DateTime StartedAt, List<QuizAnswerDto> Answers);
public record QuizResultItemDto(Guid QuestionId, string? SelectedOption, string CorrectOption, bool IsCorrect, string? Explanation);
public record QuizResultDto(Guid AttemptId, int TotalQuestions, int CorrectCount, int Score, int DurationSeconds, List<QuizResultItemDto> Results);
public record QuizAttemptSummaryDto(Guid Id, int Score, int CorrectCount, int TotalQuestions, DateTime FinishedAt);
public record LeaderboardEntryDto(Guid UserId, string DisplayName, int BestScore, int Attempts);
public record CreateQuestionRequest(string Question, string OptionA, string OptionB, string OptionC, string OptionD,
    string CorrectOption, string? Explanation, int Difficulty, string? Topic, string? Period);
// Dùng cho màn hình quản lý (Admin) — kèm đáp án đúng + giải thích
public record QuizQuestionAdminDto(Guid Id, string Question, string OptionA, string OptionB, string OptionC, string OptionD,
    string CorrectOption, string? Explanation, int Difficulty, string? Topic, string? Period);

// ----- Flashcards -----
public record FlashcardDto(Guid Id, string Front, string Back, string? Topic, string? Period);
public record ReviewFlashcardRequest(bool Remembered);
public record CreateFlashcardRequest(string Front, string Back, string? Topic, string? Period);

// ----- Stats -----
public record StatsOverviewDto(int TotalUsers, int ActiveUsers7d, int TotalSessions, int TotalUserMessages,
    int TotalQuizAttempts, double AvgQuizScore, int TotalFlashcardReviews);
public record DayCountDto(string Day, int Count);
public record StatsActivityDto(List<DayCountDto> MessagesPerDay, List<DayCountDto> NewUsersPerDay);
public record ScoreBucketDto(string Bucket, int Count);
public record StatsQuizDto(List<ScoreBucketDto> ScoreDistribution, List<DayCountDto> AttemptsPerDay, double AvgScore, int BestScore);

// ----- Mapping helpers -----
public static class Mapping
{
    public static UserDto ToDto(this User u) => new(u.Id, u.Username, u.DisplayName, u.Email, (int)u.Role, u.AvatarUrl);
    public static ChatSessionDto ToDto(this ChatSession s) => new(s.Id, s.Title, s.CreatedAt, s.UpdatedAt);
    public static ChatMessageDto ToDto(this ChatMessage m) => new(m.Id, m.Role, m.Content, m.CreatedAt, m.TokenCount);
    public static FlashcardDto ToDto(this Flashcard f) => new(f.Id, f.Front, f.Back, f.Topic, f.Period);
    public static QuizQuestionDto ToDto(this QuizQuestion q) => new(
        q.Id, q.Question,
        new Dictionary<string, string> { ["A"] = q.OptionA, ["B"] = q.OptionB, ["C"] = q.OptionC, ["D"] = q.OptionD },
        q.Difficulty, q.Topic, q.Period);

    public static QuizQuestionAdminDto ToAdminDto(this QuizQuestion q) => new(
        q.Id, q.Question, q.OptionA, q.OptionB, q.OptionC, q.OptionD,
        q.CorrectOption, q.Explanation, q.Difficulty, q.Topic, q.Period);
}
