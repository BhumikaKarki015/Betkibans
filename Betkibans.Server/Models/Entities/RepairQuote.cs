namespace Betkibans.Server.Models.Entities;

public class RepairQuote
{
    public int RepairQuoteId { get; set; }
    public int RepairRequestId { get; set; }
    public int SellerId { get; set; }
    public decimal EstimatedCost { get; set; }
    public int EstimatedDays { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public RepairRequest RepairRequest { get; set; } = null!;
    public Seller Seller { get; set; } = null!;
}