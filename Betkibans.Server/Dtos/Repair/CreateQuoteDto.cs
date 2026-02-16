namespace Betkibans.Server.Dtos.Repair;

public class CreateQuoteDto
{
    public int RepairRequestId { get; set; }
    public decimal EstimatedCost { get; set; }
    public int EstimatedDays { get; set; }
    public string Description { get; set; } = string.Empty;
}