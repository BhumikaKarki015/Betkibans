namespace Betkibans.Server.Dtos.Material
{
    public class MaterialResponseDto
    {
        public int MaterialId { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}