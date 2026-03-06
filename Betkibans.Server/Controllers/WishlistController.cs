using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public WishlistController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Wishlist
    [HttpGet]
    public async Task<IActionResult> GetMyWishlist()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var items = await _context.Wishlists
            .Include(w => w.Product)
                .ThenInclude(p => p.ProductImages)
            .Include(w => w.Product)
                .ThenInclude(p => p.Seller)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.AddedAt)
            .Select(w => new
            {
                w.WishlistId,
                w.ProductId,
                w.AddedAt,
                ProductName = w.Product.Name,
                ProductPrice = w.Product.Price,
                ProductDiscountPrice = w.Product.DiscountPrice,
                ProductImage = w.Product.ProductImages
                    .OrderBy(i => i.ProductImageId)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault(),
                w.Product.StockQuantity,
                w.Product.AverageRating,
                w.Product.TotalReviews,
                SellerBusinessName = w.Product.Seller.BusinessName,
            })
            .ToListAsync();

        return Ok(items);
    }

    // POST: api/Wishlist
    [HttpPost]
    public async Task<IActionResult> AddToWishlist([FromBody] AddWishlistDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Check if already wishlisted
        var exists = await _context.Wishlists
            .AnyAsync(w => w.UserId == userId && w.ProductId == dto.ProductId);
        if (exists) return Ok(new { message = "Already in wishlist" });

        // Check product exists
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return NotFound("Product not found");

        var wishlist = new Wishlist
        {
            UserId = userId!,
            ProductId = dto.ProductId,
            AddedAt = DateTime.UtcNow
        };

        _context.Wishlists.Add(wishlist);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Added to wishlist", wishlistId = wishlist.WishlistId });
    }

    // DELETE: api/Wishlist/{productId}
    [HttpDelete("{productId}")]
    public async Task<IActionResult> RemoveFromWishlist(int productId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var item = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);
        if (item == null) return NotFound("Item not in wishlist");

        _context.Wishlists.Remove(item);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Removed from wishlist" });
    }
}

public class AddWishlistDto
{
    public int ProductId { get; set; }
}