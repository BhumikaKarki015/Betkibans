using Betkibans.Server.Data;
using Betkibans.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace Betkibans.Server.Controllers;

/*
   PaymentController integrates the Khalti Payment Gateway.
   It handles the initiation of online payments and the subsequent
   verification (lookup) to ensure funds were successfully captured
   before updating order statuses.
 */
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    // Constructor injecting DB context, app configuration, and HTTP client factory
    public PaymentController(ApplicationDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    /*  Step 1: Initiates a payment request with Khalti.
        Generates a unique 'pidx' (Payment Index) and returns a URL
        where the user can complete the transaction.
     */
    // POST: api/Payment/initiate/{orderId}
    [HttpPost("initiate/{orderId}")]
    public async Task<IActionResult> InitiatePayment(int orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Fetch the order and ensure it belongs to the authenticated user
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

        if (order == null) return NotFound(new { message = "Order not found" });
        if (order.PaymentStatus == "Paid") return BadRequest(new { message = "Order already paid" });

        // Retrieve user profile to pre-fill customer info in the Khalti payment portal
        var appUser = await _context.Users.FindAsync(userId);

        var secretKey = _config["Khalti:SecretKey"];
        var baseUrl = _config["Khalti:BaseUrl"];

        // Khalti requires the amount in 'Paisa' (NPR * 100)
        var amountInPaisa = (int)(order.TotalAmount * 100);

        // Construct the payload as per Khalti ePayment API documentation
        var frontendUrl = _config["App:FrontendUrl"] ?? "https://betkibans.vercel.app";

        var payload = new
        {
            return_url = $"{frontendUrl}/payment/success",
            website_url = frontendUrl,
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

        // Initialize HTTP Client with Khalti's Secret Key in the Authorization header
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Authorization", $"Key {secretKey}");

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // POST the initiation request to Khalti's servers
        var response = await client.PostAsync($"{baseUrl}epayment/initiate/", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return BadRequest(new { message = "Failed to initiate Khalti payment", detail = responseBody });

        // Parse the response to get the Payment URL and the PIDX tracking ID
        var result = JsonSerializer.Deserialize<JsonElement>(responseBody);
        var paymentUrl = result.GetProperty("payment_url").GetString();
        var pidx = result.GetProperty("pidx").GetString();

        // Persist the pidx to the database so we can verify this specific transaction later
        order.KhaltiPidx = pidx;
        await _context.SaveChangesAsync();

        return Ok(new { paymentUrl, pidx });
    }

    /*  Step 2: Verifies the payment status after the user returns from Khalti.
        Uses the PIDX to perform a lookup on Khalti's servers to confirm 'Completed' status.
     */
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

        // Prepare the lookup payload using the PIDX provided by the frontend
        var payload = new { pidx = dto.Pidx };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // Request transaction status from Khalti
        var response = await client.PostAsync($"{baseUrl}epayment/lookup/", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return BadRequest(new { message = "Payment verification failed", detail = responseBody });

        var result = JsonSerializer.Deserialize<JsonElement>(responseBody);
        var status = result.GetProperty("status").GetString();

        // Business logic: Only proceed if the transaction status is explicitly 'Completed'
        if (status != "Completed")
            return BadRequest(new { message = $"Payment not completed. Status: {status}" });

        // Find order by pidx
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.KhaltiPidx == dto.Pidx && o.UserId == userId);

        if (order == null) return NotFound(new { message = "Order not found" });

        // Update the order to reflect that it has been paid and is ready for processing
        order.PaymentStatus = "Paid";
        order.Status = "Processing";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Payment verified successfully", orderId = order.OrderId, orderNumber = order.OrderNumber });
    }
}

// DTO for receiving the payment index from the client-side success callback
public class VerifyPaymentDto
{
    public string Pidx { get; set; } = string.Empty;
}