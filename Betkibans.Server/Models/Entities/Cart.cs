namespace Betkibans.Server.Models.Entities;

public class Cart
{
    public int CartId { get; set; }
    public string UserId { get; set; } = string.Empty; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
}