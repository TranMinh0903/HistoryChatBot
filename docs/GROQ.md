# Tích hợp Groq (AI cho ChatBot)

Groq cung cấp API **tương thích OpenAI**, có **free tier** rộng rãi (nhiều token, tốc độ rất nhanh). Backend C# chỉ cần gọi HTTP.

## 1. Lấy API key
1. Đăng ký tại https://console.groq.com (miễn phí).
2. Tạo API key ở mục **API Keys**.
3. Lưu vào biến môi trường, **không commit vào git**:
   - `GROQ_API_KEY=gsk_xxx`

## 2. Thông số
| Mục | Giá trị |
|---|---|
| Base URL | `https://api.groq.com/openai/v1` |
| Endpoint | `POST /chat/completions` |
| Auth | header `Authorization: Bearer $GROQ_API_KEY` |
| Model đề xuất | `llama-3.3-70b-versatile` (chất lượng, tiếng Việt tốt) |
| Model nhanh/nhẹ | `llama-3.1-8b-instant` (rẻ token, trả lời nhanh) |

> ⚠️ Danh sách model trên Groq thay đổi theo thời gian — kiểm tra lại tại https://console.groq.com/docs/models nếu báo lỗi `model_not_found`.

## 3. System prompt (tiếng Việt — giới hạn chủ đề)

```text
Bạn là trợ lý AI chuyên về LỊCH SỬ ĐẢNG CỘNG SẢN VIỆT NAM, tập trung giai đoạn 1954–1975.
Nhiệm vụ: giúp sinh viên ôn tập, giải thích sự kiện, mốc thời gian, nhân vật, ý nghĩa lịch sử.

Nguyên tắc:
- Luôn trả lời bằng tiếng Việt, chính xác, có mốc thời gian/sự kiện cụ thể.
- Trình bày rõ ràng, có thể dùng gạch đầu dòng; độ dài vừa phải, dễ hiểu cho sinh viên.
- Bám sát các giai đoạn: khôi phục kinh tế miền Bắc, đấu tranh thống nhất, kháng chiến chống Mỹ,
  Tổng tiến công Mậu Thân 1968, Hiệp định Paris 1973, Đại thắng mùa Xuân 1975.
- Nếu câu hỏi nằm NGOÀI chủ đề lịch sử Đảng/Việt Nam giai đoạn này, hãy lịch sự nhắc lại phạm vi
  và mời người dùng hỏi đúng chủ đề.
- Không bịa số liệu. Nếu không chắc, nói rõ là chưa chắc chắn.
- Giọng văn thân thiện như một gia sư.
```

## 4. Request mẫu

```jsonc
POST https://api.groq.com/openai/v1/chat/completions
{
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.4,
  "max_tokens": 1024,
  "messages": [
    { "role": "system", "content": "<system prompt ở trên>" },
    { "role": "user", "content": "Chiến dịch Điện Biên Phủ diễn ra năm nào?" },
    { "role": "assistant", "content": "..." },   // lịch sử đoạn chat (lấy từ DB)
    { "role": "user", "content": "Ý nghĩa của nó là gì?" }
  ]
}
```
Response (OpenAI-compatible):
```jsonc
{ "choices": [ { "message": { "role": "assistant", "content": "..." } } ],
  "usage": { "completion_tokens": 320, "total_tokens": 480 } }
```

## 5. Code C# mẫu (ASP.NET Core)

`appsettings.json` / env:
```jsonc
"Groq": { "BaseUrl": "https://api.groq.com/openai/v1", "Model": "llama-3.3-70b-versatile" }
// API key đọc từ env GROQ_API_KEY
```

Service:
```csharp
public sealed class GroqChatService
{
    private readonly HttpClient _http;
    private readonly string _model;
    private const string SystemPrompt = "Bạn là trợ lý AI chuyên về Lịch sử Đảng ...";

    public GroqChatService(HttpClient http, IConfiguration cfg)
    {
        _http = http;
        _http.BaseAddress = new Uri(cfg["Groq:BaseUrl"]!);
        _http.DefaultRequestHeaders.Authorization =
            new("Bearer", Environment.GetEnvironmentVariable("GROQ_API_KEY"));
        _model = cfg["Groq:Model"]!;
    }

    public async Task<(string content, int tokens)> AskAsync(
        IEnumerable<(string role, string content)> history, CancellationToken ct = default)
    {
        var messages = new List<object> { new { role = "system", content = SystemPrompt } };
        messages.AddRange(history.Select(m => new { role = m.role, content = m.content }));

        var payload = new { model = _model, temperature = 0.4, max_tokens = 1024, messages };
        var resp = await _http.PostAsJsonAsync("chat/completions", payload, ct);
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var root = doc.RootElement;
        var content = root.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString()!;
        var tokens = root.GetProperty("usage").GetProperty("completion_tokens").GetInt32();
        return (content, tokens);
    }
}
```

Đăng ký DI (`Program.cs`):
```csharp
builder.Services.AddHttpClient<GroqChatService>();
```

## 6. Lưu ý free tier
- Có giới hạn **requests/phút** và **tokens/phút**. Nếu nhận HTTP 429 → chờ rồi thử lại (exponential backoff).
- Đặt `max_tokens` hợp lý (1024) để tiết kiệm và tránh trả lời quá dài.
- Có thể cache câu trả lời cho các câu hỏi lặp lại nếu muốn.
