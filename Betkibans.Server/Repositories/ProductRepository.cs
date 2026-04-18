using Betkibans.Server.Data;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Repositories;

/*
   ProductRepository serves as the primary data access layer for the catalog.
   It handles complex eager loading of related entities (Seller, Category, Images, Materials)
   to provide a comprehensive product model for the UI and business logic.
 */
public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;

    public ProductRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /*  Retrieves a single product by ID with its full context.
        This includes the seller details, category, image gallery, and
        many-to-many material relationships.
     */
    public async Task<Product?> GetByIdAsync(int productId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Seller)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductMaterials)
                .ThenInclude(pm => pm.Material)
            .FirstOrDefaultAsync(p => p.ProductId == productId);
    }

    /*  Fetches all active products in the system.
        Sorted by creation date (newest first) to highlight fresh arrivals in the catalog.
     */
    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Seller)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductMaterials)
                .ThenInclude(pm => pm.Material)
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    /*  Retrieves products belonging to a specific artisan.
        Useful for building out "Seller Shop" pages.
     */
    public async Task<IEnumerable<Product>> GetBySellerIdAsync(int sellerId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Where(p => p.SellerId == sellerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    // Retrieves active products within a specific category.
    public async Task<IEnumerable<Product>> GetByCategoryIdAsync(int categoryId)
    {
        return await _context.Products
            .Include(p => p.Seller)
            .Include(p => p.ProductImages)
            .Where(p => p.CategoryId == categoryId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    // Persists a new product record to the database
    public async Task<Product> CreateAsync(Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    // Saves changes made to an existing product entry
    public async Task<Product> UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
        return product;
    }

    /*  Performs a Hard Delete on a product.
        Note: Use this with caution as it removes the record permanently.
        For order history integrity, consider using a soft-delete (IsActive = false).
     */
    public async Task<bool> DeleteAsync(int productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            return false;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    // Lightweight check to verify if a product exists by its primary key
    public async Task<bool> ExistsAsync(int productId)
    {
        return await _context.Products.AnyAsync(p => p.ProductId == productId);
    }
}