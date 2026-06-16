using LichSuDang.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QuizAttemptAnswer> QuizAttemptAnswers => Set<QuizAttemptAnswer>();
    public DbSet<Flashcard> Flashcards => Set<Flashcard>();
    public DbSet<FlashcardReview> FlashcardReviews => Set<FlashcardReview>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.Username).HasMaxLength(50).IsRequired();
            e.Property(x => x.Email).HasMaxLength(150);
            e.Property(x => x.DisplayName).HasMaxLength(100);
            e.Property(x => x.Role).HasConversion<int>();
        });

        b.Entity<ChatSession>(e =>
        {
            e.ToTable("chat_sessions");
            e.Property(x => x.Title).HasMaxLength(200);
            e.HasIndex(x => new { x.UserId, x.UpdatedAt });
            e.HasOne(x => x.User).WithMany(u => u.Sessions)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ChatMessage>(e =>
        {
            e.ToTable("chat_messages");
            e.Property(x => x.Role).HasMaxLength(16);
            e.HasIndex(x => new { x.SessionId, x.CreatedAt });
            e.HasOne(x => x.Session).WithMany(s => s.Messages)
                .HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<QuizQuestion>(e =>
        {
            e.ToTable("quiz_questions");
            e.Property(x => x.CorrectOption).HasMaxLength(1);
            e.Property(x => x.Topic).HasMaxLength(100);
            e.Property(x => x.Period).HasMaxLength(50);
        });

        b.Entity<QuizAttempt>(e =>
        {
            e.ToTable("quiz_attempts");
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<QuizAttemptAnswer>(e =>
        {
            e.ToTable("quiz_attempt_answers");
            e.Property(x => x.SelectedOption).HasMaxLength(1);
            e.HasOne(x => x.Attempt).WithMany(a => a.Answers)
                .HasForeignKey(x => x.AttemptId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Flashcard>(e =>
        {
            e.ToTable("flashcards");
            e.Property(x => x.Topic).HasMaxLength(100);
            e.Property(x => x.Period).HasMaxLength(50);
        });

        b.Entity<FlashcardReview>(e =>
        {
            e.ToTable("flashcard_reviews");
            e.HasIndex(x => new { x.UserId, x.FlashcardId });
        });
    }
}
