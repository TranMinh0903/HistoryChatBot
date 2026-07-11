using Pgvector;

namespace LichSuDang.Api.Domain;

public enum Role { User = 1, Admin = 2 }

// Một đoạn văn bản trích từ tài liệu VNR202 + vector embedding (cho RAG).
public class DocumentChunk
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Source { get; set; } = "";   // vd "Session 5"
    public string Content { get; set; } = "";
    public Vector? Embedding { get; set; }      // vector(768) từ Gemini
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = "";
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public Role Role { get; set; } = Role.User;
    public string? AvatarUrl { get; set; }             // ảnh đại diện (data URL nén hoặc URL Google)
    public string? GoogleId { get; set; }              // sub của Google (nếu đăng nhập bằng Google)
    public int LoginCount { get; set; }                // số lượt đăng nhập thật (cho thống kê admin)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public List<ChatSession> Sessions { get; set; } = new();
}

public class ChatSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Title { get; set; } = "Đoạn chat mới";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<ChatMessage> Messages { get; set; } = new();
}

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public ChatSession? Session { get; set; }
    public string Role { get; set; } = "user"; // user | assistant | system
    public string Content { get; set; } = "";
    public int? TokenCount { get; set; }
    public string? Sources { get; set; }        // nguồn RAG, phân tách bằng dấu phẩy (vd "Session 17,Session 19")
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class QuizQuestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Question { get; set; } = "";
    public string OptionA { get; set; } = "";
    public string OptionB { get; set; } = "";
    public string OptionC { get; set; } = "";
    public string OptionD { get; set; } = "";
    public string CorrectOption { get; set; } = "A"; // "A" | "B" | "C" | "D"
    public string? Explanation { get; set; }
    public int Difficulty { get; set; } = 1; // 1=Dễ 2=TB 3=Khó
    public string? Topic { get; set; }
    public string? Period { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class QuizAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public int Score { get; set; }
    public int? DurationSeconds { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime FinishedAt { get; set; } = DateTime.UtcNow;

    public List<QuizAttemptAnswer> Answers { get; set; } = new();
}

public class QuizAttemptAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AttemptId { get; set; }
    public QuizAttempt? Attempt { get; set; }
    public Guid QuestionId { get; set; }
    public string? SelectedOption { get; set; }
    public bool IsCorrect { get; set; }
}

public class Flashcard
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Front { get; set; } = "";
    public string Back { get; set; } = "";
    public string? Topic { get; set; }
    public string? Period { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FlashcardReview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid FlashcardId { get; set; }
    public bool Remembered { get; set; }
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
}
