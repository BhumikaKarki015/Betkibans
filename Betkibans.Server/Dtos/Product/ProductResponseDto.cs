namespace Betkibans.Server.DTOs.Product;

public class ProductResponseDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal? Length { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public decimal? Weight { get; set; }
    public bool IsActive { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Seller info
    public int SellerId { get; set; }
    public string SellerBusinessName { get; set; } = string.Empty;
    
    // Materials
    public List<string> Materials { get; set; } = new List<string>();
    
    // Images
    public List<string> ImageUrls { get; set; } = new List<string>();
}