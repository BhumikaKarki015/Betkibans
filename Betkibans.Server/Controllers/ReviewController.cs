using System.Security.Claims;
using Betkibans.Server.Data;
using Betkibans.Server.Dtos.Review;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReviewController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReviewController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Review/product/{productId}
    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetProductReviews(int productId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)  
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponseDto
            {
                ReviewId = r.ReviewId,
                ProductId = r.ProductId,
                ReviewerName = r.User.FullName ?? "Anonymous",
                Rating = r.Rating,
                Title = r.Title,
                ReviewText = r.ReviewText,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    // POST: api/Review
    [HttpPost]
    [Authorize(Roles = "Consumer")]
    public async Task<IActionResult> SubmitReview([FromBody] CreateReviewDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // Check if product exists
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return NotFound("Product not found.");

        // Check if user already reviewed this product
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ProductId == dto.ProductId && r.UserId == userId);
        if (existingReview != null)
            return BadRequest(new { message = "You have already reviewed this product." });

        // Check if verified purchase
        var hasPurchased = await _context.Orders
            .Include(o => o.OrderItems)
            .AnyAsync(o => o.UserId == userId &&
                           o.OrderItems.Any(oi => oi.ProductId == dto.ProductId) &&
                           o.Status == "Delivered");

        var review = new Review
        {
            ProductId = dto.ProductId,
            UserId = userId,
            Rating = dto.Rating,
            Title = dto.Title,
            ReviewText = dto.ReviewText,
            IsVerifiedPurchase = hasPurchased,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);

        // Update product average rating
        await _context.SaveChangesAsync();
        
        var allRatings = await _context.Reviews
            .Where(r => r.ProductId == dto.ProductId)
            .Select(r => r.Rating)
            .ToListAsync();
        
        product.AverageRating = (decimal)allRatings.Average();
        product.TotalReviews = allRatings.Count;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Review submitted successfully!", reviewId = review.ReviewId });
    }
}