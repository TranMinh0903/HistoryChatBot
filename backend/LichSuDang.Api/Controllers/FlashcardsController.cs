using LichSuDang.Api.Data;
using LichSuDang.Api.Domain;
using LichSuDang.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Controllers;

[Route("api/flashcards")]
public class FlashcardsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public FlashcardsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<FlashcardDto>>> Get([FromQuery] string? topic, [FromQuery] string? period)
    {
        var q = _db.Flashcards.AsQueryable();
        if (!string.IsNullOrWhiteSpace(topic)) q = q.Where(f => f.Topic == topic);
        if (!string.IsNullOrWhiteSpace(period)) q = q.Where(f => f.Period == period);
        return await q.OrderBy(f => f.Period).Select(f => f.ToDto()).ToListAsync();
    }

    [HttpPost("{id}/review")]
    public async Task<IActionResult> Review(Guid id, ReviewFlashcardRequest req)
    {
        if (!await _db.Flashcards.AnyAsync(f => f.Id == id)) return NotFound();
        _db.FlashcardReviews.Add(new FlashcardReview { UserId = UserId, FlashcardId = id, Remembered = req.Remembered });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<FlashcardDto>> Create(CreateFlashcardRequest req)
    {
        var f = new Flashcard { Front = req.Front, Back = req.Back, Topic = req.Topic, Period = req.Period };
        _db.Flashcards.Add(f);
        await _db.SaveChangesAsync();
        return f.ToDto();
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, CreateFlashcardRequest req)
    {
        var f = await _db.Flashcards.FindAsync(id);
        if (f is null) return NotFound();
        f.Front = req.Front; f.Back = req.Back; f.Topic = req.Topic; f.Period = req.Period;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var f = await _db.Flashcards.FindAsync(id);
        if (f is null) return NotFound();
        _db.Flashcards.Remove(f);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
