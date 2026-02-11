namespace Betkibans.Server.Dtos.Order;

public class OrderRequestDto
{
    public int AddressId { get; set; }
    public string PaymentMethod { get; set; } = "COD";
    public string? Notes { get; set; }
}