using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ContactController(ApplicationDbContext context)
    {
        _context = context;
    }

    // POST: api/Contact/submit
    [HttpPost("submit")]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] ContactMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { message = "Name, email, and message are required." });

        var message = new ContactMessage
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim(),
            Phone = dto.Phone?.Trim(),
            InquiryType = dto.InquiryType ?? "General Inquiry",
            Subject = dto.Subject?.Trim(),
            Message = dto.Message.Trim(),
        };

        _context.ContactMessages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Message received! We'll get back to you within 24 hours." });
    }

    // GET: api/Contact/messages (Admin only)
    [HttpGet("messages")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetMessages()
    {
        var messages = await _context.ContactMessages
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
        return Ok(messages);
    }

    // PUT: api/Contact/messages/{id}/read (Admin only)
    [HttpPut("messages/{id}/read")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var message = await _context.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();
        message.IsRead = true;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Marked as read." });
    }

    // DELETE: api/Contact/messages/{id} (Admin only)
    [HttpDelete("messages/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteMessage(int id)
    {
        var message = await _context.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();
        _context.ContactMessages.Remove(message);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Message deleted." });
    }
}

public class ContactMessageDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? InquiryType { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
}