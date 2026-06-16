using System.Text.Json;

namespace LichSuDang.Api.Services;

/// <summary>
/// Gọi Groq API (tương thích OpenAI). Xem docs/GROQ.md.
/// API key đọc từ env GROQ_API_KEY hoặc cấu hình "Groq:ApiKey".
/// </summary>
public class GroqChatService
{
    private readonly HttpClient _http;
    private readonly string _model;
    private readonly string? _apiKey;
    private readonly ILogger<GroqChatService> _log;

    private const string SystemPrompt =
        "Bạn là trợ lý AI chuyên về LỊCH SỬ ĐẢNG CỘNG SẢN VIỆT NAM, tập trung giai đoạn 1954–1975. " +
        "Nhiệm vụ: giúp sinh viên ôn tập, giải thích sự kiện, mốc thời gian, nhân vật, ý nghĩa lịch sử. " +
        "Nguyên tắc: luôn trả lời bằng tiếng Việt, chính xác, có mốc thời gian/sự kiện cụ thể; trình bày rõ ràng, " +
        "có thể dùng gạch đầu dòng; độ dài vừa phải. Bám sát các giai đoạn: khôi phục kinh tế miền Bắc, đấu tranh " +
        "thống nhất, kháng chiến chống Mỹ, Tết Mậu Thân 1968, Hiệp định Paris 1973, Đại thắng mùa Xuân 1975. " +
        "Nếu câu hỏi nằm NGOÀI chủ đề này, hãy lịch sự nhắc lại phạm vi và mời hỏi đúng chủ đề. " +
        "Không bịa số liệu; nếu không chắc, nói rõ. Giọng văn thân thiện như một gia sư.";

    public GroqChatService(HttpClient http, IConfiguration cfg, ILogger<GroqChatService> log)
    {
        _http = http;
        _log = log;
        _http.BaseAddress = new Uri(cfg["Groq:BaseUrl"] ?? "https://api.groq.com/openai/v1/");
        _model = cfg["Groq:Model"] ?? "llama-3.3-70b-versatile";
        _apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? cfg["Groq:ApiKey"];
    }

    public async Task<(string Content, int Tokens)> AskAsync(
        IEnumerable<(string Role, string Content)> history, CancellationToken ct = default)
    {
        // Không có API key → trả lời fallback để hệ thống vẫn chạy được khi dev.
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _log.LogWarning("GROQ_API_KEY chưa được cấu hình — trả lời fallback.");
            return ("⚠️ Hệ thống chưa cấu hình GROQ_API_KEY. Vui lòng đặt biến môi trường GROQ_API_KEY " +
                    "để bật trả lời AI. (Xem docs/GROQ.md)", 0);
        }

        var messages = new List<object> { new { role = "system", content = SystemPrompt } };
        foreach (var (role, content) in history)
            messages.Add(new { role, content });

        var payload = new { model = _model, temperature = 0.4, max_tokens = 1024, messages };

        using var req = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
        req.Headers.Add("Authorization", $"Bearer {_apiKey}");
        req.Content = JsonContent.Create(payload);

        using var resp = await _http.SendAsync(req, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            _log.LogError("Groq error {Status}: {Body}", resp.StatusCode, body);
            return ($"⚠️ Lỗi gọi Groq ({(int)resp.StatusCode}). Vui lòng thử lại.", 0);
        }

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var text = root.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
        var tokens = root.TryGetProperty("usage", out var usage) &&
                     usage.TryGetProperty("completion_tokens", out var ctk) ? ctk.GetInt32() : 0;
        return (text, tokens);
    }
}
