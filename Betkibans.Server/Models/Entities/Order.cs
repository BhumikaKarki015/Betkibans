using System.ComponentModel.DataAnnotations;

namespace Betkibans.Server.Models.Entities;

public class Order
{
    [Key]
    public int OrderId { get; set; }
    public string UserId { get; set; } = string.Empty; 
    public int AddressId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Processing, Shipped, Delivered, Cancelled
    [Required]
    public string PaymentMethod { get; set; } = "COD";
    public string PaymentStatus { get; set; } = "Pending"; 
    public string? KhaltiPidx { get; set; }
    public string? Notes { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation Properties
    public Address Address { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public Payment? Payment { get; set; }
}