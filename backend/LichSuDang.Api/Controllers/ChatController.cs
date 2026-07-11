using System.Text;
using System.Text.Json;
using LichSuDang.Api.Data;
using LichSuDang.Api.Domain;
using LichSuDang.Api.Dtos;
using LichSuDang.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[Route("api/chat")]
public class ChatController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly GroqChatService _groq;
    public ChatController(AppDbContext db, GroqChatService groq) { _db = db; _groq = groq; }

    [HttpGet("sessions")]
    public async Task<ActionResult<List<ChatSessionDto>>> GetSessions()
    {
        var list = await _db.ChatSessions
            .Where(s => s.UserId == UserId)
            .OrderByDescending(s => s.UpdatedAt)
            .Select(s => s.ToDto())
            .ToListAsync();
        return list;
    }

    [HttpPost("sessions")]
    public async Task<ActionResult<ChatSessionDto>> CreateSession(CreateSessionRequest req)
    {
        var s = new ChatSession
        {
            UserId = UserId,
            Title = string.IsNullOrWhiteSpace(req.Title) ? "Đoạn chat mới" : req.Title!,
        };
        _db.ChatSessions.Add(s);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMessages), new { id = s.Id }, s.ToDto());
    }

    [HttpGet("sessions/{id}/messages")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(Guid id)
    {
        if (!await OwnsSession(id)) return NotFound();
        var msgs = await _db.ChatMessages
            .Where(m => m.SessionId == id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => m.ToDto())
            .ToListAsync();
        return msgs;
    }

    [HttpPost("sessions/{id}/messages")]
    public async Task<ActionResult<SendMessageResponse>> SendMessage(Guid id, SendMessageRequest req)
    {
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == UserId);
        if (session is null) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Content)) return BadRequest(new { error = "Nội dung trống" });

        var history = await _db.ChatMessages
            .Where(m => m.SessionId == id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new { m.Role, m.Content })
            .ToListAsync();
        var isFirst = history.Count == 0;

        var userMsg = new ChatMessage { SessionId = id, Role = "user", Content = req.Content };
        _db.ChatMessages.Add(userMsg);

        // gọi Groq với lịch sử + tin nhắn mới
        var convo = history.Select(h => (h.Role, h.Content)).Append(("user", req.Content));
        var (answer, tokens) = await _groq.AskAsync(convo);

        var botMsg = new ChatMessage { SessionId = id, Role = "assistant", Content = answer, TokenCount = tokens };
        _db.ChatMessages.Add(botMsg);

        if (isFirst) session.Title = req.Content.Length > 60 ? req.Content[..60] : req.Content;
        session.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return new SendMessageResponse(userMsg.ToDto(), botMsg.ToDto());
    }

    // Phiên bản STREAMING (Server-Sent Events) — chữ AI hiện dần.
    private static readonly JsonSerializerOptions JsonWeb = new(JsonSerializerDefaults.Web);

    [HttpPost("sessions/{id}/messages/stream")]
    public async Task StreamMessage(Guid id, SendMessageRequest req)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("X-Accel-Buffering", "no");

        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == UserId);
        if (session is null) { await WriteEvent(new { type = "error", error = "Không tìm thấy đoạn chat" }); return; }
        if (string.IsNullOrWhiteSpace(req.Content)) { await WriteEvent(new { type = "error", error = "Nội dung trống" }); return; }

        var history = await _db.ChatMessages
            .Where(m => m.SessionId == id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new { m.Role, m.Content })
            .ToListAsync();
        var isFirst = history.Count == 0;

        var userMsg = new ChatMessage { SessionId = id, Role = "user", Content = req.Content };
        _db.ChatMessages.Add(userMsg);
        await _db.SaveChangesAsync();
        await WriteEvent(new { type = "user", message = userMsg.ToDto() });

        var convo = history.Select(h => (h.Role, h.Content)).Append(("user", req.Content));
        var sb = new StringBuilder();
        await foreach (var delta in _groq.AskStreamAsync(convo, HttpContext.RequestAborted))
        {
            sb.Append(delta);
            await WriteEvent(new { type = "delta", content = delta });
        }

        var botMsg = new ChatMessage { SessionId = id, Role = "assistant", Content = sb.ToString() };
        _db.ChatMessages.Add(botMsg);
        if (isFirst) session.Title = req.Content.Length > 60 ? req.Content[..60] : req.Content;
        session.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await WriteEvent(new { type = "done", assistantMessage = botMsg.ToDto() });
    }

    private async Task WriteEvent(object payload)
    {
        await Response.WriteAsync($"data: {JsonSerializer.Serialize(payload, JsonWeb)}\n\n");
        await Response.Body.FlushAsync();
    }

    [HttpPatch("sessions/{id}")]
    public async Task<ActionResult<ChatSessionDto>> Rename(Guid id, RenameSessionRequest req)
    {
        var s = await _db.ChatSessions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (s is null) return NotFound();
        s.Title = req.Title;
        await _db.SaveChangesAsync();
        return s.ToDto();
    }

    [HttpDelete("sessions/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var s = await _db.ChatSessions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (s is null) return NotFound();
        _db.ChatSessions.Remove(s);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private Task<bool> OwnsSession(Guid id) =>
        _db.ChatSessions.AnyAsync(s => s.Id == id && s.UserId == UserId);
}
