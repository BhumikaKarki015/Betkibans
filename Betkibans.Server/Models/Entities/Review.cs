namespace Betkibans.Server.Models.Entities;

public class Review
{
    public int ReviewId { get; set; }
    public int ProductId { get; set; }
    public string UserId { get; set; } = string.Empty; 
    public int Rating { get; set; } // 1-5 stars
    public string? Title { get; set; }
    public string ReviewText { get; set; } = string.Empty;
    public bool IsVerifiedPurchase { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    public ApplicationUser User { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
    