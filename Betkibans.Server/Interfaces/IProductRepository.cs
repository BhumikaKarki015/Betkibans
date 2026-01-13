using Betkibans.Server.Models.Entities;

namespace Betkibans.Server.Interfaces;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(int productId);
    Task<IEnumerable<Product>> GetAllAsync();
    Task<IEnumerable<Product>> GetBySellerIdAsync(int sellerId);
    Task<IEnumerable<Product>> GetByCategoryIdAsync(int categoryId);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task<bool> DeleteAsync(int productId);
    Task<bool> ExistsAsync(int productId);
}