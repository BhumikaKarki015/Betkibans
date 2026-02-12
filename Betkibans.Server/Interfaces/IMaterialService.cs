using Betkibans.Server.Dtos.Material;

namespace Betkibans.Server.Interfaces
{
    public interface IMaterialService
    {
        Task<IEnumerable<MaterialResponseDto>> GetAllMaterialsAsync();
        Task<MaterialResponseDto?> GetMaterialByIdAsync(int id);
        Task<MaterialResponseDto> CreateMaterialAsync(CreateMaterialDto createDto);
        Task<bool> UpdateMaterialAsync(int id, CreateMaterialDto updateDto);
        Task<bool> DeleteMaterialAsync(int id);
    }
}