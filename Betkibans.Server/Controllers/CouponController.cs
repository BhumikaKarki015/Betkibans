using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

/* Data Transfer Objects (DTOs) for Coupon operations.
   ValidateCouponDto is used by customers at checkout.
   CreateCouponDto is used by admins to manage promotions.
 */
public class ValidateCouponDto
{
    public string Code { get; set; } = string.Empty;
    public decimal OrderTotal { get; set; }
}

public class CreateCouponDto
{
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "Percentage"; // "Percentage" or "Fixed"
    public decimal DiscountValue { get; set; }
    public decimal MinOrderAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public int UsageLimit { get; set; } = 100;
    public bool IsActive { get; set; } = true;
    public DateTime ExpiresAt { get; set; }
    public string? Description { get; set; }
}

/*
   CouponController manages the lifecycle and validation of promotional codes.
   It provides public endpoints for applying discounts and administrative
   endpoints for creating and managing coupon rules.
 */
[Route("api/[controller]")]
[ApiController]
public class CouponController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CouponController(ApplicationDbContext context)
    {
        _context = context;
    }

    /* Validates a coupon code against current business rules.
       Checks for: existence, active status, expiration, usage limits,
       and minimum order requirements.
     */
    // POST: api/Coupon/validate
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponDto dto)
    {
        // Normalize the code to uppercase for consistent matching
        var code = dto.Code?.Trim().ToUpper();
        if (string.IsNullOrEmpty(code))
            return BadRequest(new { message = "Please enter a coupon code." });

        // Fetch coupon if it exists and is marked as active
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

        if (coupon == null)
            return BadRequest(new { message = "Invalid coupon code." });

        // Rule 1: Check Expiration Date
        if (coupon.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { message = "This coupon has expired." });

        // Rule 2: Check Usage Limit (e.g., first 100 users)
        if (coupon.UsedCount >= coupon.UsageLimit)
            return BadRequest(new { message = "This coupon has reached its usage limit." });

        // Rule 3: Check Minimum Order Amount
        if (dto.OrderTotal < coupon.MinOrderAmount)
            return BadRequest(new { message = "This coupon requires a minimum order of NPR " + coupon.MinOrderAmount.ToString("N0") + "." });

        decimal discount;
        // Calculation Logic: Support for both percentage-based and flat-rate discounts
        if (coupon.DiscountType == "Percentage")
        {
            discount = Math.Round(dto.OrderTotal * (coupon.DiscountValue / 100), 2);
            
            // Apply ceiling if a maximum discount amount is defined
            if (coupon.MaxDiscountAmount.HasValue)
                discount = Math.Min(discount, coupon.MaxDiscountAmount.Value);
        }
        else
        {
            discount = coupon.DiscountValue;
        }

        // Final safeguard: discount cannot exceed the total order value
        discount = Math.Min(discount, dto.OrderTotal);

        return Ok(new
        {
            couponId = coupon.CouponId,
            code = coupon.Code,
            discountType = coupon.DiscountType,
            discountValue = coupon.DiscountValue,
            discountAmount = discount,
            description = coupon.Description,
            message = "Coupon applied! You save NPR " + discount.ToString("N0") + "."
        });
    }

    /* Retrieves a list of all coupons (Active and Inactive).
       Restricted to Administrators.
     */
    // GET: api/Coupon (Admin only)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var coupons = await _context.Coupons
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
        return Ok(coupons);
    }

    /* Creates a new coupon entry in the database.
       Prevents duplicate coupon codes.
     */
    // POST: api/Coupon (Admin only)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCouponDto dto)
    {
        var code = dto.Code?.Trim().ToUpper();
        if (string.IsNullOrEmpty(code))
            return BadRequest(new { message = "Code is required." });

        var exists = await _context.Coupons.AnyAsync(c => c.Code == code);
        if (exists)
            return BadRequest(new { message = "A coupon with this code already exists." });

        var coupon = new Coupon
        {
            Code = code,
            DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue,
            MinOrderAmount = dto.MinOrderAmount,
            MaxDiscountAmount = dto.MaxDiscountAmount,
            UsageLimit = dto.UsageLimit,
            IsActive = dto.IsActive,
            ExpiresAt = dto.ExpiresAt,
            Description = dto.Description,
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();
        return Ok(coupon);
    }

    // Updates the parameters of an existing coupon.
    // PUT: api/Coupon/{id} (Admin only)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateCouponDto dto)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon == null) return NotFound();

        var code = dto.Code?.Trim().ToUpper();
        
        // Ensure that if the code is changed, it doesn't conflict with another existing coupon
        var codeExists = await _context.Coupons.AnyAsync(c => c.Code == code && c.CouponId != id);
        if (codeExists)
            return BadRequest(new { message = "A coupon with this code already exists." });

        coupon.Code = code ?? coupon.Code;
        coupon.DiscountType = dto.DiscountType;
        coupon.DiscountValue = dto.DiscountValue;
        coupon.MinOrderAmount = dto.MinOrderAmount;
        coupon.MaxDiscountAmount = dto.MaxDiscountAmount;
        coupon.UsageLimit = dto.UsageLimit;
        coupon.IsActive = dto.IsActive;
        coupon.ExpiresAt = dto.ExpiresAt;
        coupon.Description = dto.Description;

        await _context.SaveChangesAsync();
        return Ok(coupon);
    }

    // Permanently removes a coupon from the system.
    // DELETE: api/Coupon/{id} (Admin only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon == null) return NotFound();
        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Coupon deleted." });
    }

    /* Toggles the 'IsActive' status without deleting the record.
       Useful for temporarily disabling a promotion.
     */
    // PATCH: api/Coupon/{id}/toggle (Admin only)
    [HttpPatch("{id}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Toggle(int id)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon == null) return NotFound();
        coupon.IsActive = !coupon.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { isActive = coupon.IsActive });
    }
}