using System.ComponentModel.DataAnnotations;

namespace Betkibans.Server.DTOs.Product;

public class CreateProductDto
{
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(200, ErrorMessage = "Product name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Price is required")]
    [Range(0.01, 999999.99, ErrorMessage = "Price must be between 0.01 and 999999.99")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Stock quantity is required")]
    [Range(0, int.MaxValue, ErrorMessage = "Stock quantity must be non-negative")]
    public int StockQuantity { get; set; }

    [Required(ErrorMessage = "Category is required")]
    public int CategoryId { get; set; }

    // Optional dimensions
    public decimal? Length { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public decimal? Weight { get; set; }

    // List of material IDs (e.g., [1, 2] for Bamboo and Cane)
    public List<int> MaterialIds { get; set; } = new List<int>();
    
    [Required(ErrorMessage = "At least one product image is required.")]
    public List<IFormFile> Images { get; set; } = new List<IFormFile>();
}