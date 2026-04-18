using System.Security.Claims;
using Betkibans.Server.Data;
using Betkibans.Server.Dtos.Repair;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

/*
   RepairController manages the "Repair Marketplace" lifecycle.
   It allows customers to post damage reports (RepairRequests) and
   enables verified sellers to bid on those repairs (RepairQuotes).
 */
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

    /* Endpoint for customers to submit a repair request.
       Supports optional product linking and image uploads for visual damage assessment.
     */
    [HttpPost("submit-request")]
    public async Task<IActionResult> SubmitRequest([FromForm] CreateRepairRequestDto dto, IFormFile? image)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        
        // If ProductId is 0 or negative, treat it as a 'General Item' not purchased on the platform
        // This prevents the Foreign Key error if the product doesn't exist
        int? finalProductId = (dto.ProductId > 0) ? dto.ProductId : null;

        string? imageUrl = null;
        if (image != null)
        {
            // Generate a unique filename and save the damage evidence image to the server
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

    /* Retrieves all repair requests submitted by the logged-in user.
       Includes all associated quotes from different sellers for comparison.
     */
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
    
    /* Specialized view for Sellers to see "Open" repair jobs.
       Shows 'Pending' jobs (to bid on) or jobs they have already 'Accepted' or 'Completed'.
     */
    [HttpGet("available-requests")]
    [Authorize(Roles = "Seller")]
    public async Task<ActionResult<IEnumerable<RepairRequestResponseDto>>> GetAvailableRequests()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return Unauthorized();

        var requests = await _context.RepairRequests
            .Include(r => r.Product)
            .Include(r => r.RepairQuotes)
            // Filter: Show all new requests OR requests specific to this seller's accepted work
            .Where(r => r.Status == "Pending" || 
                        ((r.Status == "Accepted" || r.Status == "Completed") && r.RepairQuotes.Any(q => q.SellerId == seller.SellerId && q.Status == "Accepted")))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        // For accepted requests, fetch customer info separately using UserId
        var result = new List<RepairRequestResponseDto>();
        foreach (var r in requests)
        {
            string? customerName = null;
            string? customerPhone = null;
            string? customerEmail = null;

            // Privacy logic: Only share contact info once the user has accepted the seller's quote
            if (r.Status == "Accepted" || r.Status == "Completed")
            {
                var customer = await _context.Users.FindAsync(r.UserId);
                customerName = customer?.FullName;
                customerPhone = customer?.PhoneNumber;
                customerEmail = customer?.Email;
            }

            result.Add(new RepairRequestResponseDto
            {
                RepairRequestId = r.RepairRequestId,
                ProductName = r.Product?.Name ?? "General Bamboo Item",
                Description = r.Description,
                DamageImageUrl = r.DamageImageUrl,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                CustomerName = customerName,
                CustomerPhone = customerPhone,
                CustomerEmail = customerEmail,
            });
        }

        return Ok(result);
    }

    /* Allows a seller to submit a bid (quote) for a repair request.
       Automatically updates the request status to notify the user.
     */
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
    
    /* Finalizes the agreement between customer and seller.
       When one quote is accepted, all other competing bids are automatically 'Rejected'.
     */
    [HttpPost("accept-quote/{quoteId}")]
    public async Task<IActionResult> AcceptQuote(int quoteId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    
        var quote = await _context.RepairQuotes
            .Include(q => q.RepairRequest)
            .FirstOrDefaultAsync(q => q.RepairQuoteId == quoteId && q.RepairRequest.UserId == userId);

        if (quote == null) return NotFound("Quote not found or unauthorized.");

        // Lock the request to the winning seller
        quote.Status = "Accepted";
        quote.RepairRequest.Status = "Accepted";

        // Bulk-reject all other bids to clean up the marketplace
        var otherQuotes = await _context.RepairQuotes
            .Where(q => q.RepairRequestId == quote.RepairRequestId && q.RepairQuoteId != quoteId)
            .ToListAsync();
    
        foreach (var other in otherQuotes) other.Status = "Rejected";

        await _context.SaveChangesAsync();
        return Ok(new { message = "Quote accepted! You can now coordinate with the seller." });
    }

    /* Marks the physical repair as finished.
       Only the seller who was accepted for the job can trigger this.
     */
    // POST: api/Repair/complete/{requestId}
    [HttpPost("complete/{requestId}")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> CompleteRepair(int requestId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return Unauthorized();

        // Verify this seller has an accepted quote for this request
        var request = await _context.RepairRequests
            .Include(r => r.RepairQuotes)
            .FirstOrDefaultAsync(r => r.RepairRequestId == requestId &&
                                      r.Status == "Accepted" &&
                                      r.RepairQuotes.Any(q => q.SellerId == seller.SellerId && q.Status == "Accepted"));

        if (request == null)
            return NotFound("Repair request not found or you are not the assigned seller.");

        request.Status = "Completed";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Repair marked as completed!" });
    }
}