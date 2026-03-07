namespace Betkibans.Server.Dtos.Order;

public class OrderRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public int? AddressId { get; set; }
    public string City { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    
    public string PaymentMethod { get; set; } = "COD";
    public string? Notes { get; set; }
}