using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

/*
   WishlistController manages the "Saved Items" functionality.
   It allows users to curate a personal list of products they are interested in,
   facilitating future purchases and reducing friction in the shopping experience.
 */
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

    /* Retrieves the authenticated user's saved products.
       Includes essential product metadata, primary images, and seller names
       to populate the wishlist UI efficiently.
     */
    
    // GET: api/Wishlist
    [HttpGet]
    public async Task<IActionResult> GetMyWishlist()
    {
        // Identify the user from the current security context
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Eagerly load product details and related images/sellers
        var items = await _context.Wishlists
            .Include(w => w.Product)
                .ThenInclude(p => p.ProductImages)
            .Include(w => w.Product)
                .ThenInclude(p => p.Seller)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.AddedAt)
            // Use projection to return a flattened anonymous object for better performance
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

    /* Adds a product to the user's wishlist.
       Prevents duplicate entries and ensures the product actually exists.
     */
    
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

    /* Removes an item from the user's wishlist.
       This action is specific to the user's ID to prevent unauthorized deletions.
     */
    
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

// Data Transfer Object for adding items to the wishlist.
public class AddWishlistDto
{
    public int ProductId { get; set; }
}