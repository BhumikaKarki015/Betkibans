using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

/*
   ContactController manages external communications from users.
   It allows visitors to submit inquiries and provides an administrative
   interface to review, organize, and prune received messages.
 */
[Route("api/[controller]")]
[ApiController]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ContactController(ApplicationDbContext context)
    {
        _context = context;
    }

    /*  Endpoint for the public contact form.
        Sanitizes input and saves user inquiries to the database.
        No authentication required to allow potential new customers to reach out.
     */
    // POST: api/Contact/submit
    [HttpPost("submit")]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] ContactMessageDto dto)
    {
        // Simple manual validation to ensure critical fields aren't empty
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { message = "Name, email, and message are required." });

        // Mapping DTO to Entity while trimming whitespace for data cleanliness
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

    /* Retrieves the full list of contact messages for the admin dashboard.
       Sorted by the most recent inquiries first.
     */
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

    /* Updates the status of a message to 'Read'.
       Helps admins keep track of which inquiries have been processed.
     */
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

    // Permanently removes a message from the database.
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

/*
   Data Transfer Object for incoming contact submissions.
   Provides a clean interface for the frontend to send user data.
 */
public class ContactMessageDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? InquiryType { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
}