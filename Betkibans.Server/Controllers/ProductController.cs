using Betkibans.Server.DTOs.Product;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ApplicationDbContext _context;

    public ProductController(IProductService productService, ApplicationDbContext context)
    {
        _productService = productService ?? throw new ArgumentNullException(nameof(productService));
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    // GET: api/product
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetAllProducts()
    {
        try
        {
            var products = await _productService.GetAllProductsAsync();
            return Ok(products);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving products", error = ex.Message });
        }
    }

    // GET: api/product/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductResponseDto>> GetProductById(int id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound(new { message = $"Product with ID {id} not found" });

            return Ok(product);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving product", error = ex.Message });
        }
    }

    // GET: api/product/seller/{sellerId}
    [HttpGet("seller/{sellerId}")]
    public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetProductsBySeller(int sellerId)
    {
        try
        {
            var products = await _productService.GetProductsBySellerIdAsync(sellerId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving seller products", error = ex.Message });
        }
    }

    // GET: api/product/category/{categoryId}
    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetProductsByCategory(int categoryId)
    {
        try
        {
            var products = await _productService.GetProductsByCategoryIdAsync(categoryId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving category products", error = ex.Message });
        }
    }

    // POST: api/product
    [HttpPost]
    [Authorize(Roles = "Seller")]
    public async Task<ActionResult<ProductResponseDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            Console.WriteLine("[CreateProduct] Method called");
            Console.WriteLine($"[CreateProduct] _productService is null: {_productService == null}");
            Console.WriteLine($"[CreateProduct] _context is null: {_context == null}");

            // Get authenticated user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            Console.WriteLine($"[CreateProduct] UserId from token: {userId}");
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Get seller profile
            var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
            
            Console.WriteLine($"[CreateProduct] Seller found: {seller != null}");
            
            if (seller == null)
            {
                return BadRequest(new { message = "Seller profile not found" });
            }

            Console.WriteLine($"[CreateProduct] SellerId: {seller.SellerId}, IsVerified: {seller.IsVerified}");

            // Check if seller is verified
            if (!seller.IsVerified)
            {
                return StatusCode(403, new { message = "Your seller account is not verified yet. Please complete KYC verification to list products." });
            }

            Console.WriteLine($"[CreateProduct] About to call CreateProductAsync");

            // Create product
            var product = await _productService.CreateProductAsync(dto, seller.SellerId);
            
            Console.WriteLine($"[CreateProduct] Product created successfully with ID: {product.ProductId}");
            
            return CreatedAtAction(nameof(GetProductById), new { id = product.ProductId }, product);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CreateProduct] EXCEPTION: {ex.Message}");
            Console.WriteLine($"[CreateProduct] Stack Trace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Error creating product", error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    // PUT: api/product/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Seller")]
    public async Task<ActionResult<ProductResponseDto>> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        try
        {
            if (id != dto.ProductId)
                return BadRequest(new { message = "Product ID mismatch" });

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seller == null)
                return BadRequest(new { message = "Seller profile not found" });

            var product = await _productService.UpdateProductAsync(dto, seller.SellerId);
            return Ok(product);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating product", error = ex.Message });
        }
    }

    // DELETE: api/product/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seller == null)
                return BadRequest(new { message = "Seller profile not found" });

            var result = await _productService.DeleteProductAsync(id, seller.SellerId);
            if (!result)
                return NotFound(new { message = $"Product with ID {id} not found" });

            return Ok(new { message = "Product deleted successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting product", error = ex.Message });
        }
    }
}