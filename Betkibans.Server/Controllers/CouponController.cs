using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

public class ValidateCouponDto
{
    public string Code { get; set; } = string.Empty;
    public decimal OrderTotal { get; set; }
}

public class CreateCouponDto
{
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "Percentage";
    public decimal DiscountValue { get; set; }
    public decimal MinOrderAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public int UsageLimit { get; set; } = 100;
    public bool IsActive { get; set; } = true;
    public DateTime ExpiresAt { get; set; }
    public string? Description { get; set; }
}

[Route("api/[controller]")]
[ApiController]
public class CouponController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CouponController(ApplicationDbContext context)
    {
        _context = context;
    }

    // POST: api/Coupon/validate
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponDto dto)
    {
        var code = dto.Code?.Trim().ToUpper();
        if (string.IsNullOrEmpty(code))
            return BadRequest(new { message = "Please enter a coupon code." });

        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

        if (coupon == null)
            return BadRequest(new { message = "Invalid coupon code." });

        if (coupon.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { message = "This coupon has expired." });

        if (coupon.UsedCount >= coupon.UsageLimit)
            return BadRequest(new { message = "This coupon has reached its usage limit." });

        if (dto.OrderTotal < coupon.MinOrderAmount)
            return BadRequest(new { message = "This coupon requires a minimum order of NPR " + coupon.MinOrderAmount.ToString("N0") + "." });

        decimal discount;
        if (coupon.DiscountType == "Percentage")
        {
            discount = Math.Round(dto.OrderTotal * (coupon.DiscountValue / 100), 2);
            if (coupon.MaxDiscountAmount.HasValue)
                discount = Math.Min(discount, coupon.MaxDiscountAmount.Value);
        }
        else
        {
            discount = coupon.DiscountValue;
        }

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

    // PUT: api/Coupon/{id} (Admin only)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateCouponDto dto)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon == null) return NotFound();

        var code = dto.Code?.Trim().ToUpper();
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