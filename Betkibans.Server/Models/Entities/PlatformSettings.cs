namespace Betkibans.Server.Models.Entities;
 
public class PlatformSettings
{
    public int Id { get; set; } = 1; // Single row — always Id = 1
 
    // Platform Info
    public string PlatformName { get; set; } = "Betkibans";
    public string Tagline { get; set; } = "Authentic Nepali Bamboo & Cane Furniture";
    public string SupportEmail { get; set; } = "support@betkibans.com";
    public string SupportPhone { get; set; } = "+977-1-4567890";
    public string Address { get; set; } = "Thamel, Kathmandu, Nepal";
 
    // Commission & Order Limits
    public decimal CommissionRate { get; set; } = 10;
    public decimal RepairCommissionRate { get; set; } = 10;
    public decimal MinOrderAmount { get; set; } = 500;
    public decimal MaxOrderAmount { get; set; } = 500000;
 
    // Seller Settings
    public bool RequireSellerVerification { get; set; } = true;
    public bool AutoApproveVerifiedSellers { get; set; } = false;
    public bool AllowDiscounts { get; set; } = true;
    public bool EnableSellerAnalytics { get; set; } = true;
    public decimal MinProductPrice { get; set; } = 100;
    public int MaxProductImages { get; set; } = 10;
    public int MinDescriptionLength { get; set; } = 50;
 
    // Customer Settings
    public bool AllowGuestCheckout { get; set; } = false;
    public bool EnableWishlist { get; set; } = true;
    public bool EnableProductReviews { get; set; } = true;
    public bool EnablePurchaseForReview { get; set; } = true;
    public bool EnableRepairRequests { get; set; } = true;
 
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; set; }
}