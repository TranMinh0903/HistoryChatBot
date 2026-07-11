using System.Text.Json;

namespace LichSuDang.Api.Services;

// Sinh vector embedding bằng Google Gemini (model gemini-embedding-001, 768 chiều).
// Key đọc từ env GEMINI_API_KEY hoặc cấu hình "Gemini:ApiKey".
public class EmbeddingService
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;
    private readonly ILogger<EmbeddingService> _log;

    public const int Dim = 768;
    private const string Model = "gemini-embedding-001";

    public EmbeddingService(HttpClient http, IConfiguration cfg, ILogger<EmbeddingService> log)
    {
        _http = http;
        _log = log;
        _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? cfg["Gemini:ApiKey"];
    }

    public bool Enabled => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<float[]?> EmbedAsync(string text, CancellationToken ct = default)
    {
        if (!Enabled || string.IsNullOrWhiteSpace(text)) return null;

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Model}:embedContent?key={_apiKey}";
        var payload = new
        {
            model = $"models/{Model}",
            content = new { parts = new[] { new { text } } },
            outputDimensionality = Dim,
        };

        try
        {
            using var resp = await _http.PostAsJsonAsync(url, payload, ct);
            if (!resp.IsSuccessStatusCode)
            {
                _log.LogError("Gemini embed error {Status}", resp.StatusCode);
                return null;
            }
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var vals = doc.RootElement.GetProperty("embedding").GetProperty("values");
            var arr = new float[vals.GetArrayLength()];
            var i = 0;
            foreach (var v in vals.EnumerateArray()) arr[i++] = v.GetSingle();
            return arr;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Gemini embed exception");
            return null;
        }
    }
}
