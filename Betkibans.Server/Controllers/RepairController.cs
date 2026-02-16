using System.Security.Claims;
using Betkibans.Server.Data;
using Betkibans.Server.Dtos.Repair;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RepairController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public RepairController(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpPost("submit-request")]
    public async Task<IActionResult> SubmitRequest([FromForm] CreateRepairRequestDto dto, IFormFile? image)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        
        // This prevents the Foreign Key error if the product doesn't exist
        int? finalProductId = (dto.ProductId > 0) ? dto.ProductId : null;

        string? imageUrl = null;
        if (image != null)
        {
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
            var filePath = Path.Combine(_environment.WebRootPath, "uploads", "repairs", fileName);
        
            Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);
            using var stream = new FileStream(filePath, FileMode.Create);
            await image.CopyToAsync(stream);
            imageUrl = $"/uploads/repairs/{fileName}";
        }

        var request = new RepairRequest
        {
            UserId = userId,
            ProductId = finalProductId, 
            Description = dto.Description,
            DamageImageUrl = imageUrl,
            Status = "Pending"
        };

        _context.RepairRequests.Add(request);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Repair request submitted successfully", requestId = request.RepairRequestId });
    }

    [HttpGet("my-requests")]
    public async Task<ActionResult<IEnumerable<RepairRequestResponseDto>>> GetMyRequests()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var requests = await _context.RepairRequests
            .Include(r => r.Product)
            .Include(r => r.RepairQuotes)
                .ThenInclude(q => q.Seller)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var response = requests.Select(r => new RepairRequestResponseDto
        {
            RepairRequestId = r.RepairRequestId,
            ProductName = r.Product?.Name ?? "General Bamboo Item",
            Description = r.Description,
            DamageImageUrl = r.DamageImageUrl,
            Status = r.Status,
            CreatedAt = r.CreatedAt,
            Quotes = r.RepairQuotes.Select(q => new RepairQuoteDto
            {
                RepairQuoteId = q.RepairQuoteId,
                SellerBusinessName = q.Seller.BusinessName,
                EstimatedCost = q.EstimatedCost,
                EstimatedDays = q.EstimatedDays,
                Description = q.Description,
                Status = q.Status,
                CreatedAt = q.CreatedAt
            }).ToList()
        });

        return Ok(response);
    }
    
    [HttpGet("available-requests")]
    [Authorize(Roles = "Seller")]
    public async Task<ActionResult<IEnumerable<RepairRequestResponseDto>>> GetAvailableRequests()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return Unauthorized();

        // Show requests that are Pending OR where this specific seller has an Accepted quote
        var requests = await _context.RepairRequests
            .Include(r => r.Product)
            .Include(r => r.RepairQuotes)
            .Where(r => r.Status == "Pending" || 
                        (r.Status == "Accepted" && r.RepairQuotes.Any(q => q.SellerId == seller.SellerId && q.Status == "Accepted")))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var response = requests.Select(r => new RepairRequestResponseDto
        {
            RepairRequestId = r.RepairRequestId,
            ProductName = r.Product?.Name ?? "General Bamboo Item",
            Description = r.Description,
            DamageImageUrl = r.DamageImageUrl,
            Status = r.Status, // This will now show "Accepted" if the customer picked them
            CreatedAt = r.CreatedAt
        });

        return Ok(response);
    }

    // 2. Submit a quote for a specific request
    [HttpPost("submit-quote")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> SubmitQuote([FromBody] CreateQuoteDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        
        if (seller == null) return Unauthorized("You are not registered as a seller.");

        var quote = new RepairQuote
        {
            RepairRequestId = dto.RepairRequestId,
            SellerId = seller.SellerId,
            EstimatedCost = dto.EstimatedCost,
            EstimatedDays = dto.EstimatedDays,
            Description = dto.Description,
            Status = "Pending"
        };

        _context.RepairQuotes.Add(quote);
        
        var request = await _context.RepairRequests.FindAsync(dto.RepairRequestId);
        if (request != null) request.Status = "QuotesReceived";

        await _context.SaveChangesAsync();
        return Ok(new { message = "Quote submitted successfully!" });
    }
    
    [HttpPost("accept-quote/{quoteId}")]
    public async Task<IActionResult> AcceptQuote(int quoteId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    
        // Find the quote and include the request to verify ownership
        var quote = await _context.RepairQuotes
            .Include(q => q.RepairRequest)
            .FirstOrDefaultAsync(q => q.RepairQuoteId == quoteId && q.RepairRequest.UserId == userId);

        if (quote == null) return NotFound("Quote not found or unauthorized.");

        // Update statuses
        quote.Status = "Accepted";
        quote.RepairRequest.Status = "Accepted";

        // Reject all other quotes for this request
        var otherQuotes = await _context.RepairQuotes
            .Where(q => q.RepairRequestId == quote.RepairRequestId && q.RepairQuoteId != quoteId)
            .ToListAsync();
    
        foreach (var other in otherQuotes) other.Status = "Rejected";

        await _context.SaveChangesAsync();
        return Ok(new { message = "Quote accepted! You can now coordinate with the seller." });
    }
}