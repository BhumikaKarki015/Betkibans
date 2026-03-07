using Betkibans.Server.Data;
using Betkibans.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace Betkibans.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public PaymentController(ApplicationDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    // POST: api/Payment/initiate/{orderId}
    [HttpPost("initiate/{orderId}")]
    public async Task<IActionResult> InitiatePayment(int orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

        if (order == null) return NotFound(new { message = "Order not found" });
        if (order.PaymentStatus == "Paid") return BadRequest(new { message = "Order already paid" });

        // Load user details separately
        var appUser = await _context.Users.FindAsync(userId);

        var secretKey = _config["Khalti:SecretKey"];
        var baseUrl = _config["Khalti:BaseUrl"];

        var amountInPaisa = (int)(order.TotalAmount * 100);

        var payload = new
        {
            return_url = "http://localhost:5173/payment/success",
            website_url = "http://localhost:5173",
            amount = amountInPaisa,
            purchase_order_id = order.OrderNumber,
            purchase_order_name = $"Betkibans Order #{order.OrderNumber}",
            customer_info = new
            {
                name = appUser?.FullName ?? "Customer",
                email = appUser?.Email ?? "",
                phone = appUser?.PhoneNumber ?? "9800000000"
            }
        };

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Authorization", $"Key {secretKey}");

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync($"{baseUrl}epayment/initiate/", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return BadRequest(new { message = "Failed to initiate Khalti payment", detail = responseBody });

        var result = JsonSerializer.Deserialize<JsonElement>(responseBody);
        var paymentUrl = result.GetProperty("payment_url").GetString();
        var pidx = result.GetProperty("pidx").GetString();

        // Save pidx to order for later verification
        order.KhaltiPidx = pidx;
        await _context.SaveChangesAsync();

        return Ok(new { paymentUrl, pidx });
    }

    // POST: api/Payment/verify
    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var secretKey = _config["Khalti:SecretKey"];
        var baseUrl = _config["Khalti:BaseUrl"];

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Authorization", $"Key {secretKey}");

        var payload = new { pidx = dto.Pidx };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync($"{baseUrl}epayment/lookup/", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return BadRequest(new { message = "Payment verification failed", detail = responseBody });

        var result = JsonSerializer.Deserialize<JsonElement>(responseBody);
        var status = result.GetProperty("status").GetString();

        if (status != "Completed")
            return BadRequest(new { message = $"Payment not completed. Status: {status}" });

        // Find order by pidx
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.KhaltiPidx == dto.Pidx && o.UserId == userId);

        if (order == null) return NotFound(new { message = "Order not found" });

        // Update payment and order status
        order.PaymentStatus = "Paid";
        order.Status = "Processing";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Payment verified successfully", orderId = order.OrderId, orderNumber = order.OrderNumber });
    }
}

public class VerifyPaymentDto
{
    public string Pidx { get; set; } = string.Empty;
}