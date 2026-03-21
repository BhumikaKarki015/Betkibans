namespace Betkibans.Server.Models.Entities;

public class Coupon
{
    public int CouponId { get; set; }
    public string Code { get; set; } = string.Empty;        // e.g. "WELCOME10"
    public string DiscountType { get; set; } = "Percentage"; // "Percentage" or "Fixed"
    public decimal DiscountValue { get; set; }               // 10 = 10% or NPR 10
    public decimal MinOrderAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }          // Cap for percentage discounts
    public int UsageLimit { get; set; } = 100;
    public int UsedCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddYears(1);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Description { get; set; }
}