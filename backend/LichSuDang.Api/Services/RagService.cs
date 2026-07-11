using LichSuDang.Api.Data;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace LichSuDang.Api.Services;

// RAG: tìm các đoạn tài liệu VNR202 liên quan nhất tới câu hỏi (semantic search bằng pgvector).
public class RagService
{
    private readonly AppDbContext _db;
    private readonly EmbeddingService _emb;

    public RagService(AppDbContext db, EmbeddingService emb) { _db = db; _emb = emb; }

    public record RagResult(string Context, List<string> Sources);

    public async Task<RagResult?> RetrieveAsync(string query, int k = 4, CancellationToken ct = default)
    {
        if (!_emb.Enabled) return null;
        if (!await _db.DocumentChunks.AnyAsync(ct)) return null; // chưa nạp tài liệu

        var qvec = await _emb.EmbedAsync(query, ct);
        if (qvec is null) return null;

        var vector = new Vector(qvec);
        var chunks = await _db.DocumentChunks
            .OrderBy(c => c.Embedding!.CosineDistance(vector))
            .Take(Math.Clamp(k, 1, 10))
            .Select(c => new { c.Source, c.Content })
            .ToListAsync(ct);

        if (chunks.Count == 0) return null;

        var context = string.Join("\n\n", chunks.Select(c => $"[{c.Source}]\n{c.Content}"));
        var sources = chunks.Select(c => c.Source).Distinct().ToList();
        return new RagResult(context, sources);
    }
}
