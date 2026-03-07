using System.Security.Claims;
using Betkibans.Server.Data;
using Betkibans.Server.Dtos.Order;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

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

    [HttpPost("place-order")]
public async Task<IActionResult> PlaceOrder([FromBody] OrderRequestDto dto)
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Unauthorized();

    var cart = await _context.Carts
        .Include(c => c.CartItems)
        .ThenInclude(ci => ci.Product)
        .FirstOrDefaultAsync(c => c.UserId == userId);

    if (cart == null || !cart.CartItems.Any())
        return BadRequest("Your cart is empty.");

    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        // 1. USE EXISTING ADDRESS OR CREATE NEW ONE
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
        // 2. CREATE THE ORDER
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

        foreach (var item in cart.CartItems)
        {
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

            item.Product.StockQuantity -= item.Quantity;
        }

        order.SubTotal = calculatedSubTotal;
        order.TotalAmount = calculatedSubTotal + order.ShippingCost + order.TaxAmount;

        _context.Orders.Add(order);
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

        var response = orders.Select(o => new OrderResponseDto 
        {
            OrderId = o.OrderId,
            OrderNumber = o.OrderNumber,
            TotalAmount = o.TotalAmount,
            Status = o.Status,
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

    [HttpPost("update-status")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> UpdateOrderStatus([FromBody] UpdateStatusDto dto)
    {
        var order = await _context.Orders.FindAsync(dto.OrderId);
        if (order == null) return NotFound();

        order.Status = dto.Status;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Status updated successfully" });
    }
    
    [HttpPost("cancel/{orderId}")]
    [Authorize]
    public async Task<IActionResult> CancelOrder(int orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);
    
        if (order == null) return NotFound("Order not found.");
        if (order.Status != "Pending") return BadRequest("Only pending orders can be cancelled.");
    
        order.Status = "Cancelled";
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    
        return Ok(new { message = "Order cancelled successfully." });
    }
}