namespace Betkibans.Server.Dtos.Repair;

public class RepairQuoteDto
{
    public int RepairQuoteId { get; set; }
    public string SellerBusinessName { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }
    public int EstimatedDays { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}