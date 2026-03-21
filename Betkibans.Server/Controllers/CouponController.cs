using Betkibans.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Controllers;

public class ValidateCouponDto
{
    public string Code { get; set; } = string.Empty;
    public decimal OrderTotal { get; set; }
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

        // Calculate discount
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
}