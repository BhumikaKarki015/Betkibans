namespace Betkibans.Server.Dtos.Review;

public class ReviewResponseDto
{
    public int ReviewId { get; set; }
    public int ProductId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string ReviewText { get; set; } = string.Empty;
    public bool IsVerifiedPurchase { get; set; }
    public DateTime CreatedAt { get; set; }
}