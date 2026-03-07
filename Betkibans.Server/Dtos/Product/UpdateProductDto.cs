using System.ComponentModel.DataAnnotations;

namespace Betkibans.Server.DTOs.Product;

public class UpdateProductDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 999999.99)]
    public decimal Price { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int StockQuantity { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public decimal? Length { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public decimal? Weight { get; set; }
    public decimal? DiscountPrice { get; set; }
    public string? Color { get; set; }
    public string? FinishType { get; set; }
    public string? CraftingTimeDays { get; set; }
    public string? CareInstructions { get; set; }
    public string? CareWarnings { get; set; }

    public bool IsActive { get; set; } = true;

    public List<int> MaterialIds { get; set; } = new List<int>();
}