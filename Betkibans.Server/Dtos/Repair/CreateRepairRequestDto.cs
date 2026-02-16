namespace Betkibans.Server.Dtos.Repair;

public class CreateRepairRequestDto
{
    public int? ProductId { get; set; } // Optional, can be null if not a previous purchase
    public string Description { get; set; } = string.Empty;
}