namespace Betkibans.Server.Models.Entities;

public class Address
{
    public int AddressId { get; set; }
    public string UserId { get; set; } = string.Empty; 
    
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string? Landmark { get; set; }
    public string? PostalCode { get; set; }
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}