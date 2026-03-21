namespace Betkibans.Server.Dtos.Order;

public class UpdateStatusDto
{
    public int OrderId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? TrackingNumber { get; set; }
}