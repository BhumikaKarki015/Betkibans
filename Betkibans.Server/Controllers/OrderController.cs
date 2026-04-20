using System.Security.Claims;
using Betkibans.Server.Data;
using Betkibans.Server.Dtos.Order;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

/*
   OrderController manages the complete lifecycle of a purchase.
   It handles the transition from a Cart to a finalized Order, stock management,
   and provides distinct views for both Customers and Sellers.
 */
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrderController(ApplicationDbContext context)
    {
        _context = context;
    }

    /* Processes a new purchase request.
       This method uses a database transaction to ensure atomicity:
       either the entire order is saved and stock is reduced, or nothing is.
     */
    [HttpPost("place-order")]
    public async Task<IActionResult> PlaceOrder([FromBody] OrderRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // Load cart items along with product details to check prices and stock
        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .ThenInclude(ci => ci.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null || !cart.CartItems.Any())
            return BadRequest("Your cart is empty.");

        // Start a transaction to ensure data integrity across multiple tables
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. ADDRESS RESOLUTION
            // Determine if we use an existing address ID or create a new entry from the DTO
            int addressId;
            if (dto.AddressId.HasValue && dto.AddressId.Value > 0)
            {
                addressId = dto.AddressId.Value;
            }
            else
            {
                var newAddress = new Address
                {
                    UserId = userId,
                    FullName = dto.FullName,
                    PhoneNumber = dto.Phone,
                    AddressLine1 = dto.ShippingAddress,
                    City = dto.City,
                    District = dto.City,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Addresses.Add(newAddress);
                await _context.SaveChangesAsync();
                addressId = newAddress.AddressId;
            }
            
            // 2. ORDER INITIALIZATION
            var order = new Order
            {
                UserId = userId,
                AddressId = addressId,
                OrderItems = new List<OrderItem>(), // Initialize to prevent null crash
                OrderNumber = $"BET-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}",
                ShippingCost = 150,
                TaxAmount = 0,
                Status = "Pending",
                PaymentMethod = dto.PaymentMethod,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            decimal calculatedSubTotal = 0;

            // 3. LINE ITEM PROCESSING & STOCK VALIDATION
            foreach (var item in cart.CartItems)
            {
                // Safety check: Prevent overselling if stock was bought while user was in checkout
                if (item.Product.StockQuantity < item.Quantity)
                    return BadRequest($"Not enough stock for {item.Product.Name}");

                var itemTotal = item.Product.Price * item.Quantity;
                calculatedSubTotal += itemTotal;

                order.OrderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name, 
                    Quantity = item.Quantity,
                    UnitPrice = item.Product.Price,
                    TotalPrice = itemTotal
                });

                // Reduce inventory levels
                item.Product.StockQuantity -= item.Quantity;
            }

            order.SubTotal = calculatedSubTotal;
            order.TotalAmount = calculatedSubTotal + order.ShippingCost + order.TaxAmount;

            // 4. PERSISTENCE
            _context.Orders.Add(order);
            
            // Clear the user's cart now that the items are converted to an order
            _context.CartItems.RemoveRange(cart.CartItems);
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { orderId = order.OrderId, orderNumber = order.OrderNumber });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            // Log the actual error message to help debugging
            return StatusCode(500, $"Internal error: {ex.Message}");
        }
    }

    // Retrieves the order history for the currently logged-in customer.
    [HttpGet("my-orders")]
    public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetMyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(); // Extra safety for the demo

        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        // Map internal Entities to DTOs for the frontend
        var response = orders.Select(o => new OrderResponseDto 
        {
            OrderId = o.OrderId,
            OrderNumber = o.OrderNumber,
            TotalAmount = o.TotalAmount,
            Status = o.Status,
            TrackingNumber = o.TrackingNumber,
            CreatedAt = o.CreatedAt,
            OrderItems = o.OrderItems.Select(oi => new OrderItemResponseDto
            {
                OrderItemId = oi.OrderItemId, 
                ProductId = oi.ProductId,
                ProductName = oi.Product.Name,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice
            }).ToList()
        }).ToList();

        return Ok(response);
    }
    
    // Fetches full details for a single order, including shipping address and product images.
    [HttpGet("{orderId}")]
    [Authorize]
    public async Task<IActionResult> GetOrderById(int orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(i => i.Product)
            .ThenInclude(p => p.ProductImages)  
            .Include(o => o.Address)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

        if (order == null) return NotFound();

        return Ok(new {
            order.OrderId,
            order.OrderNumber,
            order.Status,
            order.PaymentMethod,
            order.PaymentStatus,
            order.TotalAmount,
            order.SubTotal,
            order.ShippingCost,
            order.TaxAmount,
            order.Notes,
            order.TrackingNumber,
            order.CreatedAt,
            // Map address fields explicitly
            FullName = order.Address?.FullName ?? "",
            ShippingAddress = order.Address?.AddressLine1 ?? "",
            City = order.Address?.City ?? "",
            Phone = order.Address?.PhoneNumber ?? "",
            OrderItems = order.OrderItems.Select(i => new {
                i.OrderItemId,
                i.ProductId,
                i.ProductName,
                i.Quantity,
                i.UnitPrice,
                ProductImage = i.Product.ProductImages
                    .OrderBy(img => img.ProductImageId)
                    .Select(img => img.ImageUrl)
                    .FirstOrDefault()
            })
        });
    }

    /* Special view for Sellers to see orders containing THEIR products.
       Note: A single order may contain products from multiple sellers;
       this endpoint filters to show only relevant line items to the seller.
     */
    [HttpGet("seller-orders")]
    [Authorize(Roles = "Seller")]
    public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetSellerOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .ThenInclude(p => p.ProductImages)   // chain 1: Product → Images
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .ThenInclude(p => p.Seller)          // chain 2: Product → Seller (separate Include)
            .Where(o => o.OrderItems.Any(oi => oi.Product.Seller.UserId == userId))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        
        var response = orders.Select(o => new OrderResponseDto 
        {
            OrderId = o.OrderId,
            OrderNumber = o.OrderNumber,
            TotalAmount = o.TotalAmount,
            Status = o.Status,
            CreatedAt = o.CreatedAt,
            OrderItems = o.OrderItems
                .Where(oi => oi.Product.Seller.UserId == userId)
                .Select(oi => new OrderItemResponseDto
                {
                    ProductName = oi.Product.Name,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    ProductImage = oi.Product.ProductImages  
                        .OrderBy(img => img.ProductImageId)
                        .Select(img => img.ImageUrl)
                        .FirstOrDefault()
                }).ToList()
        }).ToList();

        return Ok(response);
    }

    /* Allows sellers to advance the order status (e.g., from 'Pending' to 'Shipped')
       and attach tracking information.
     */
    [HttpPost("update-status")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> UpdateOrderStatus([FromBody] UpdateStatusDto dto)
    {
        var order = await _context.Orders.FindAsync(dto.OrderId);
        if (order == null) return NotFound();

        order.Status = dto.Status;
        order.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(dto.TrackingNumber))
            order.TrackingNumber = dto.TrackingNumber;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Status updated successfully" });
    }
    
    // Allows a user to cancel their own order, provided it hasn't been processed yet
    [HttpPost("cancel/{orderId}")]
    [Authorize]
    public async Task<IActionResult> CancelOrder(int orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);
    
        if (order == null) return NotFound("Order not found.");
        
        // Business Rule: Orders cannot be cancelled once they move past the 'Pending' stage
        if (order.Status != "Pending") return BadRequest("Only pending orders can be cancelled.");
    
        order.Status = "Cancelled";
        order.UpdatedAt = DateTime.UtcNow;

        // Restore stock quantities for each cancelled item
        foreach (var item in order.OrderItems)
        {
            if (item.Product != null)
                item.Product.StockQuantity += item.Quantity;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Order cancelled successfully." });
    }
}