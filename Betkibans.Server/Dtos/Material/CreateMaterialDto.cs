namespace Betkibans.Server.Dtos.Material
{
    public class CreateMaterialDto
    {
        public string MaterialName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}