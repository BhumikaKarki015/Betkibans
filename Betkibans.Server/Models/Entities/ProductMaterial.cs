namespace Betkibans.Server.Models.Entities;

public class ProductMaterial
{
    public int ProductMaterialId { get; set; }
    public int ProductId { get; set; }
    public int MaterialId { get; set; }
    
    // Navigation Properties
    public Product Product { get; set; } = null!;
    public Material Material { get; set; } = null!;
}