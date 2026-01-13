namespace Betkibans.Server.Models.Entities;

public class Material
{
    public int MaterialId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public ICollection<ProductMaterial> ProductMaterials { get; set; } = new List<ProductMaterial>();
}