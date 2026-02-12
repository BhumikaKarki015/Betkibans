using Betkibans.Server.Dtos.Category;

namespace Betkibans.Server.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryResponseDto>> GetAllCategoriesAsync();
        Task<CategoryResponseDto?> GetCategoryByIdAsync(int id);
        Task<CategoryResponseDto> CreateCategoryAsync(CreateCategoryDto createDto);
        Task<bool> UpdateCategoryAsync(int id, CreateCategoryDto updateDto);
        Task<bool> DeleteCategoryAsync(int id);
    }
}