using Betkibans.Server.Dtos.Material;
using Betkibans.Server.Models.Entities;
using Betkibans.Server.Interfaces;

namespace Betkibans.Server.Services
{
    public class MaterialService : IMaterialService
    {
        private readonly IMaterialRepository _materialRepository;

        public MaterialService(IMaterialRepository materialRepository)
        {
            _materialRepository = materialRepository;
        }

        public async Task<IEnumerable<MaterialResponseDto>> GetAllMaterialsAsync()
        {
            var materials = await _materialRepository.GetAllAsync();
            return materials.Select(m => new MaterialResponseDto
            {
                MaterialId = m.MaterialId,
                MaterialName = m.MaterialName,
                Description = m.Description
            });
        }

        public async Task<MaterialResponseDto?> GetMaterialByIdAsync(int id)
        {
            var material = await _materialRepository.GetByIdAsync(id);
            if (material == null) return null;

            return new MaterialResponseDto
            {
                MaterialId = material.MaterialId,
                MaterialName = material.MaterialName,
                Description = material.Description
            };
        }

        public async Task<MaterialResponseDto> CreateMaterialAsync(CreateMaterialDto createDto)
        {
            var material = new Material
            {
                MaterialName = createDto.MaterialName,
                Description = createDto.Description
            };
            await _materialRepository.AddAsync(material);
            return new MaterialResponseDto
            {
                MaterialId = material.MaterialId,
                MaterialName = material.MaterialName,
                Description = material.Description
            };
        }

        public async Task<bool> UpdateMaterialAsync(int id, CreateMaterialDto updateDto)
        {
            var material = await _materialRepository.GetByIdAsync(id);
            if (material == null) return false;

            material.MaterialName = updateDto.MaterialName;
            material.Description = updateDto.Description;
            await _materialRepository.UpdateAsync(material);
            return true;
        }

        public async Task<bool> DeleteMaterialAsync(int id)
        {
            var material = await _materialRepository.GetByIdAsync(id);
            if (material == null) return false;

            await _materialRepository.DeleteAsync(material);
            return true;
        }
    }
}