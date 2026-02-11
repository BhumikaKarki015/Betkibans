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
            var order = new Order
            {
                UserId = userId,
                AddressId = dto.AddressId,
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
            return StatusCode(500, $"Internal error: {ex.Message}");
        }
    }

    [HttpGet("my-orders")]
    public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetMyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
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
                ProductName = oi.Product.Name,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice
            }).ToList()
        }).ToList();

        return Ok(response);
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
            .Where(o => o.OrderItems.Any(oi => oi.Product.SellerId.ToString() == userId))
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
                .Where(oi => oi.Product.SellerId.ToString() == userId)
                .Select(oi => new OrderItemResponseDto
                {
                    ProductName = oi.Product.Name,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
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
}