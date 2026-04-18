using Azure.Storage.Blobs;
using Betkibans.Server.Data;
using Betkibans.Server.DTOs.Product; 
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

/*
   ProductController handles the catalog management for Betkibans.
   It supports public browsing with advanced filtering, as well as
   Seller-restricted operations like product creation (including image uploads)
   and soft-deletion.
 */
[Route("api/[controller]")]
[ApiController]
public class ProductController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public ProductController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /* Retrieves a list of active products based on multiple search and filter criteria.
       Supports search terms, category/material filtering, price ranges, and custom sorting.
     */
    // GET: api/Product
    [HttpGet]
    public async Task<IActionResult> GetAllProducts(
        [FromQuery] string? search,
        [FromQuery] int[]? categoryIds, 
        [FromQuery] int[]? materialIds,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? sort,
        [FromQuery] int? sellerId
    )
    {
        // Start with an active product query including essential related data
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductMaterials)
            .ThenInclude(pm => pm.Material)
            .Where(p => p.IsActive)
            .AsQueryable();

        // --- FILTERING LOGIC ---

        // 0. Filter by specific Seller (useful for seller profile pages)
        if (sellerId.HasValue)
        {
            query = query.Where(p => p.SellerId == sellerId.Value);
        }

        // 1. Text Search across Name and Description
        if (!string.IsNullOrEmpty(search))
        {
            var lowerSearch = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(lowerSearch) 
                                     || p.Description.ToLower().Contains(lowerSearch));
        }

        // 2. Categories (Show products that match ANY of the selected categories)
        if (categoryIds != null && categoryIds.Length > 0)
        {
            query = query.Where(p => categoryIds.Contains(p.CategoryId));
        }

        // 3. Multiselect Material Filtering (e.g., Bamboo vs Cane)
        if (materialIds != null && materialIds.Length > 0)
        {
            query = query.Where(p => p.ProductMaterials.Any(pm => materialIds.Contains(pm.MaterialId)));
        }

        // 4. Price Range Constraints
        if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice);
        if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice);

        // 5. Sorting Logic (Defaulting to newest first)
        switch (sort)
        {
            case "price_asc": query = query.OrderBy(p => p.Price); break;
            case "price_desc": query = query.OrderByDescending(p => p.Price); break;
            default: query = query.OrderByDescending(p => p.CreatedAt); break;
        }

        return Ok(await query.ToListAsync());
    }
    
    // Fetches full details for a single product by its unique ID.
    // GET: api/Product/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductMaterials)
            .ThenInclude(pm => pm.Material)
            .FirstOrDefaultAsync(p => p.ProductId == id);

        if (product == null) return NotFound();

        return Ok(product);
    }

    // Returns only the active products belonging to the logged-in Seller.
    // GET: api/Product/my-products
    [HttpGet("seller/mine")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetMyProducts()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return StatusCode(403, "Seller profile not found.");

        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductMaterials)
            .ThenInclude(pm => pm.Material)
            .Where(p => p.SellerId == seller.SellerId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(products);
    }
    
    /* Orchestrates the creation of a new product.
       This is a complex operation involving:
       1. DB Record creation, 2. Azure Blob Storage for images, 3. Many-to-Many material linking.
     */
    [HttpPost]
    [Authorize(Roles = "Seller")]
    [Consumes("multipart/form-data")] 
    public async Task<IActionResult> CreateProduct([FromForm] CreateProductDto dto)
    {
        // 1. Identity and Authorization check
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return StatusCode(403, "Seller profile not found.");
        if (!seller.IsVerified) return StatusCode(403, "Only verified sellers can add products.");

        // 2. Initial input validation
        if (dto.Images == null || dto.Images.Count == 0)
             return BadRequest("At least one image is required.");

        // 3. Map DTO to Entity and save to generate the ProductId
        var product = new Product
        {
            SellerId = seller.SellerId,
            CategoryId = dto.CategoryId,
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            StockQuantity = dto.StockQuantity,
            Length = dto.Length,
            Width = dto.Width,
            Height = dto.Height,
            Weight = dto.Weight,
            DiscountPrice = dto.DiscountPrice,
            Color = dto.Color,
            FinishType = dto.FinishType,
            CraftingTimeDays = dto.CraftingTimeDays,
            CareInstructions = dto.CareInstructions,
            CareWarnings = dto.CareWarnings,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync(); // Save to generate ProductId

        // 4. Handle Image Uploads via Azure Blob Storage
        var connectionString = _configuration["AzureStorage:ConnectionString"];
        var containerName = _configuration["AzureStorage:ContainerName"];
        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

        var isFirstImage = true;
        foreach (var file in dto.Images)
        {
            if (file.Length > 0)
            {
                var fileName = $"products/product_{product.ProductId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var blobClient = containerClient.GetBlobClient(fileName);
                using (var stream = file.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, overwrite: true);
                }
                _context.ProductImages.Add(new ProductImage
                {
                    ProductId = product.ProductId,
                    ImageUrl = blobClient.Uri.ToString(),
                    IsPrimary = isFirstImage
                });
                isFirstImage = false;
            }
        }
        await _context.SaveChangesAsync(); // Save image records

        // 5. Establish Many-to-Many relationships with Materials
        if (dto.MaterialIds != null && dto.MaterialIds.Any())
        {
            foreach (var matId in dto.MaterialIds)
            {
                _context.ProductMaterials.Add(new ProductMaterial
                {
                    ProductId = product.ProductId,
                    MaterialId = matId
                });
            }
            await _context.SaveChangesAsync(); // Save material links
        }

        return Ok(new { message = "Product created successfully with images!", productId = product.ProductId });
    }
    
    /* Updates non-image product details.
       Ensures the seller can only update products they actually own.
     */
    [HttpPut("{id}")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return Unauthorized();

        var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == id && p.SellerId == seller.SellerId);
        if (product == null) return NotFound("Product not found or access denied.");

        // Field mapping from DTO to Entity
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.StockQuantity = dto.StockQuantity;
        product.DiscountPrice = dto.DiscountPrice;
        product.Color = dto.Color;
        product.FinishType = dto.FinishType;
        product.CraftingTimeDays = dto.CraftingTimeDays;
        product.CareInstructions = dto.CareInstructions;
        product.CareWarnings = dto.CareWarnings;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Product updated successfully." });
    }
    
    /* Performs a Soft Delete on a product.
       Instead of removing the row, we set IsActive to false. This preserves
       referential integrity for existing Order Items.
     */
    [HttpDelete("{id}")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return Unauthorized();

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.ProductId == id && p.SellerId == seller.SellerId);
    
        if (product == null) return NotFound("Product not found or access denied.");

        // Soft delete — keeps order history intact
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Product deleted successfully." });
    }
}