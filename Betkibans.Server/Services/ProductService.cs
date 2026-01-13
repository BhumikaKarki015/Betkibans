using Betkibans.Server.DTOs.Product;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Models.Entities;
using Betkibans.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly ApplicationDbContext _context;

    public ProductService(IProductRepository productRepository, ApplicationDbContext context)
    {
        _productRepository = productRepository;
        _context = context;
    }

    public async Task<ProductResponseDto?> GetProductByIdAsync(int productId)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
            return null;

        return MapToResponseDto(product);
    }

    public async Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync()
    {
        var products = await _productRepository.GetAllAsync();
        return products.Select(MapToResponseDto);
    }

    public async Task<IEnumerable<ProductResponseDto>> GetProductsBySellerIdAsync(int sellerId)
    {
        var products = await _productRepository.GetBySellerIdAsync(sellerId);
        return products.Select(MapToResponseDto);
    }

    public async Task<IEnumerable<ProductResponseDto>> GetProductsByCategoryIdAsync(int categoryId)
    {
        var products = await _productRepository.GetByCategoryIdAsync(categoryId);
        return products.Select(MapToResponseDto);
    }

    public async Task<ProductResponseDto> CreateProductAsync(CreateProductDto dto, int sellerId)
{
    try
    {
        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            StockQuantity = dto.StockQuantity,
            CategoryId = dto.CategoryId,
            SellerId = sellerId,
            Length = dto.Length,
            Width = dto.Width,
            Height = dto.Height,
            Weight = dto.Weight,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Save product first
        var createdProduct = await _productRepository.CreateAsync(product);

        // Then add materials in a separate step
        if (dto.MaterialIds != null && dto.MaterialIds.Any())
        {
            foreach (var materialId in dto.MaterialIds)
            {
                var productMaterial = new ProductMaterial
                {
                    ProductId = createdProduct.ProductId,
                    MaterialId = materialId
                };
                _context.ProductMaterials.Add(productMaterial);
            }
            await _context.SaveChangesAsync();
        }

        // Reload with all includes
        var productWithIncludes = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Seller)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductMaterials)
                .ThenInclude(pm => pm.Material)
            .FirstOrDefaultAsync(p => p.ProductId == createdProduct.ProductId);

        if (productWithIncludes == null)
        {
            throw new Exception("Failed to reload product after creation");
        }

        return MapToResponseDto(productWithIncludes);
    }
    catch (Exception ex)
    {
        // Log the actual error
        Console.WriteLine($"Error in CreateProductAsync: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        throw;
    }
}

    public async Task<ProductResponseDto> UpdateProductAsync(UpdateProductDto dto, int sellerId)
    {
        var product = await _productRepository.GetByIdAsync(dto.ProductId);
        if (product == null)
            throw new Exception("Product not found");

        if (product.SellerId != sellerId)
            throw new UnauthorizedAccessException("You can only update your own products");

        // Update properties
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.StockQuantity = dto.StockQuantity;
        product.CategoryId = dto.CategoryId;
        product.Length = dto.Length;
        product.Width = dto.Width;
        product.Height = dto.Height;
        product.Weight = dto.Weight;
        product.IsActive = dto.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        // Update materials
        var existingMaterials = await _context.ProductMaterials
            .Where(pm => pm.ProductId == product.ProductId)
            .ToListAsync();
        
        _context.ProductMaterials.RemoveRange(existingMaterials);

        if (dto.MaterialIds != null && dto.MaterialIds.Any())
        {
            foreach (var materialId in dto.MaterialIds)
            {
                _context.ProductMaterials.Add(new ProductMaterial
                {
                    ProductId = product.ProductId,
                    MaterialId = materialId
                });
            }
        }

        await _productRepository.UpdateAsync(product);
        
        var updatedProduct = await _productRepository.GetByIdAsync(product.ProductId);
        return MapToResponseDto(updatedProduct!);
    }

    public async Task<bool> DeleteProductAsync(int productId, int sellerId)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
            return false;

        if (product.SellerId != sellerId)
            throw new UnauthorizedAccessException("You can only delete your own products");

        return await _productRepository.DeleteAsync(productId);
    }

    private ProductResponseDto MapToResponseDto(Product product)
    {
        try
        {
            return new ProductResponseDto
            {
                ProductId = product.ProductId,
                Name = product.Name ?? "",
                Description = product.Description ?? "",
                Price = product.Price,
                StockQuantity = product.StockQuantity,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.CategoryName ?? "Unknown Category",
                Length = product.Length,
                Width = product.Width,
                Height = product.Height,
                Weight = product.Weight,
                IsActive = product.IsActive,
                AverageRating = product.AverageRating,
                TotalReviews = product.TotalReviews,
                CreatedAt = product.CreatedAt,
                SellerId = product.SellerId,
                SellerBusinessName = product.Seller?.BusinessName ?? "Unknown Seller",
                Materials = product.ProductMaterials?
                    .Where(pm => pm != null && pm.Material != null)
                    .Select(pm => pm.Material.MaterialName)
                    .ToList() ?? new List<string>(),
                ImageUrls = product.ProductImages?
                    .Where(pi => pi != null)
                    .OrderBy(pi => pi.DisplayOrder)
                    .Select(pi => pi.ImageUrl)
                    .ToList() ?? new List<string>()
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in MapToResponseDto: {ex.Message}");
            throw;
        }
    }
}