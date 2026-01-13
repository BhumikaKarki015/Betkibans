namespace Betkibans.Server.Models.Entities;

public class RepairRequest
{
    public int RepairRequestId { get; set; }
    public string UserId { get; set; } = string.Empty; 
    public int? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? DamageImageUrl { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, QuotesReceived, Accepted, Completed, Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Product? Product { get; set; }
    public ICollection<RepairQuote> RepairQuotes { get; set; } = new List<RepairQuote>();
}