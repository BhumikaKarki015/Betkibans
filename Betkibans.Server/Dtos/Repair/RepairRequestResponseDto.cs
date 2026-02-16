namespace Betkibans.Server.Dtos.Repair;

public class RepairRequestResponseDto
{
    public int RepairRequestId { get; set; }
    public string? ProductName { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? DamageImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<RepairQuoteDto> Quotes { get; set; } = new();
}