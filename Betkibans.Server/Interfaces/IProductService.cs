using Betkibans.Server.DTOs.Product;

namespace Betkibans.Server.Interfaces;

public interface IProductService
{
    Task<ProductResponseDto?> GetProductByIdAsync(int productId);
    Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync();
    Task<IEnumerable<ProductResponseDto>> GetProductsBySellerIdAsync(int sellerId);
    Task<IEnumerable<ProductResponseDto>> GetProductsByCategoryIdAsync(int categoryId);
    Task<ProductResponseDto> CreateProductAsync(CreateProductDto dto, int sellerId);
    Task<ProductResponseDto> UpdateProductAsync(UpdateProductDto dto, int sellerId);
    Task<bool> DeleteProductAsync(int productId, int sellerId);
}