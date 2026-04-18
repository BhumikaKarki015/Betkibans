using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

/*
   CartController manages the shopping cart lifecycle for individual users.
   It handles adding items, adjusting quantities, and retrieving cart contents
   with associated product metadata.
 */
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CartController(ApplicationDbContext context)
    {
        _context = context;
    }

    /* Retrieves the current user's cart including all items,
       product details, and product images for the UI.
     */
    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        // Eagerly load CartItems -> Products -> ProductImages to minimize database roundtrips
        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .ThenInclude(ci => ci.Product)
            .ThenInclude(p => p.ProductImages)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null) return Ok(new { cartItems = new List<object>(), total = 0 });

        return Ok(cart);
    }

    /* Adds a product to the user's cart.
       If a cart doesn't exist, it creates one.
       If the product is already in the cart, it increments the quantity.
     */
    [HttpPost("add")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        // 1. Get or Create Cart
        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart { UserId = userId, UpdatedAt = DateTime.UtcNow };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        // 2. Check if product already in cart
        var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == dto.ProductId);
        if (existingItem != null)
        {
            existingItem.Quantity += dto.Quantity;
        }
        else
        {
            _context.CartItems.Add(new CartItem
            {
                CartId = cart.CartId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Item added to cart" });
    }

    // Removes a specific line item from the cart using its unique CartItemId.
    [HttpDelete("item/{cartItemId}")]
    public async Task<IActionResult> RemoveItem(int cartItemId)
    {
        var item = await _context.CartItems.FindAsync(cartItemId);
        if (item == null) return NotFound();

        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync();
        return Ok();
    }

    /* Updates the quantity of a specific item in the cart.
       If the quantity is set to 0 or less, the item is removed entirely.
     */
    [HttpPut("update-quantity")]
    public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartDto dto)
    {
        var item = await _context.CartItems.FindAsync(dto.CartItemId);
        if (item == null) return NotFound();

        // Business logic: treat zero or negative quantity as a removal request
        if (dto.Quantity <= 0)
        {
            _context.CartItems.Remove(item);
        }
        else
        {
            item.Quantity = dto.Quantity;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
}

// DTOs for structured data transfer from the client
public class AddToCartDto { public int ProductId { get; set; } public int Quantity { get; set; } }
public class UpdateCartDto { public int CartItemId { get; set; } public int Quantity { get; set; } }