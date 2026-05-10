using Azure.Storage.Blobs;
using Betkibans.Server.Data;
using Betkibans.Server.DTOs.Product; 
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

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

    // GET: api/Product
    [HttpGet]
    public async Task<IActionResult> GetAllProducts(
        [FromQuery] string? search,
        [FromQuery] int[]? categoryIds, 
        [FromQuery] int[]? materialIds,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? sort,
        [FromQuery] int? sellerId,
        [FromQuery] int pageSize = 20,   // ← ADDED
        [FromQuery] int page = 1         // ← ADDED
    )
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductMaterials)
            .ThenInclude(pm => pm.Material)
            .Where(p => p.IsActive)
            .AsQueryable();

        if (sellerId.HasValue)
            query = query.Where(p => p.SellerId == sellerId.Value);

        if (!string.IsNullOrEmpty(search))
        {
            var lowerSearch = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(lowerSearch) 
                                     || p.Description.ToLower().Contains(lowerSearch));
        }

        if (categoryIds != null && categoryIds.Length > 0)
            query = query.Where(p => categoryIds.Contains(p.CategoryId));

        if (materialIds != null && materialIds.Length > 0)
            query = query.Where(p => p.ProductMaterials.Any(pm => materialIds.Contains(pm.MaterialId)));

        if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice);
        if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice);

        switch (sort)
        {
            case "price_asc":  query = query.OrderBy(p => p.Price); break;
            case "price_desc": query = query.OrderByDescending(p => p.Price); break;
            default:           query = query.OrderByDescending(p => p.CreatedAt); break;
        }

        // ── PAGINATION ── (only change from original)
        var clampedPageSize = Math.Min(pageSize, 100); // safety cap — never return more than 100
        var result = await query
            .Skip((page - 1) * clampedPageSize)
            .Take(clampedPageSize)
            .ToListAsync();

        return Ok(result);
    }
    
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

    // GET: api/Product/seller/mine
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
    
    // POST: api/Product
    [HttpPost]
    [Authorize(Roles = "Seller")]
    [Consumes("multipart/form-data")] 
    public async Task<IActionResult> CreateProduct([FromForm] CreateProductDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return StatusCode(403, "Seller profile not found.");
        if (!seller.IsVerified) return StatusCode(403, "Only verified sellers can add products.");

        if (dto.Images == null || dto.Images.Count == 0)
            return BadRequest("At least one image is required.");

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
        await _context.SaveChangesAsync();

        await UploadImagesToBlob(product.ProductId, dto.Images);

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
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Product created successfully!", productId = product.ProductId });
    }
    
    // PUT: api/Product/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Seller")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProduct(int id, [FromForm] UpdateProductDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return Unauthorized();

        var product = await _context.Products
            .Include(p => p.ProductMaterials)
            .FirstOrDefaultAsync(p => p.ProductId == id && p.SellerId == seller.SellerId);
        if (product == null) return NotFound("Product not found or access denied.");

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.StockQuantity = dto.StockQuantity;
        product.DiscountPrice = dto.DiscountPrice;
        product.CategoryId = dto.CategoryId;
        product.Color = dto.Color;
        product.FinishType = dto.FinishType;
        product.CraftingTimeDays = dto.CraftingTimeDays;
        product.CareInstructions = dto.CareInstructions;
        product.CareWarnings = dto.CareWarnings;
        product.IsActive = dto.IsActive;
        product.Length = dto.Length;
        product.Width = dto.Width;
        product.Height = dto.Height;
        product.Weight = dto.Weight;
        product.UpdatedAt = DateTime.UtcNow;

        if (dto.MaterialIds != null)
        {
            _context.ProductMaterials.RemoveRange(product.ProductMaterials);
            foreach (var matId in dto.MaterialIds)
            {
                _context.ProductMaterials.Add(new ProductMaterial
                {
                    ProductId = product.ProductId,
                    MaterialId = matId
                });
            }
        }

        await _context.SaveChangesAsync();

        if (dto.Images != null && dto.Images.Count > 0)
        {
            await UploadImagesToBlob(product.ProductId, dto.Images);
        }

        return Ok(new { message = "Product updated successfully." });
    }
    
    // DELETE: api/Product/{id}
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

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Product deleted successfully." });
    }

    // Shared helper — uploads images to Azure Blob and saves records to DB
    private async Task UploadImagesToBlob(int productId, List<IFormFile> images)
    {
        var connectionString = _configuration["AzureStorage:ConnectionString"];
        var containerName = _configuration["AzureStorage:ContainerName"];
        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

        var isFirstImage = !await _context.ProductImages.AnyAsync(pi => pi.ProductId == productId);

        foreach (var file in images)
        {
            if (file.Length > 0)
            {
                var fileName = $"products/product_{productId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var blobClient = containerClient.GetBlobClient(fileName);
                using var stream = file.OpenReadStream();
                await blobClient.UploadAsync(stream, overwrite: true);

                _context.ProductImages.Add(new ProductImage
                {
                    ProductId = productId,
                    ImageUrl = blobClient.Uri.ToString(),
                    IsPrimary = isFirstImage
                });
                isFirstImage = false;
            }
        }
        await _context.SaveChangesAsync();
    }
}