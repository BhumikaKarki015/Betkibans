using Azure.Storage.Blobs;
using Betkibans.Server.Data;
using Betkibans.Server.DTOs.Seller;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

/*
   SellerController serves as the primary hub for artisan business management.
   It manages seller profiles, document verification (KYC), branding, and
   provides a deep-dive analytics suite for sellers to track their performance.
 */
[ApiController]
[Route("api/[controller]")]
public class SellerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public SellerController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // ==========================================================================
    // SELLER ACTIONS (Restricted to users with the "Seller" role)
    // ==========================================================================

    /* * Retrieves the comprehensive profile of the logged-in seller.
     * Combines data from both the Seller entity and the linked Identity User record.
     */

    // GET: api/Seller/profile
    [HttpGet("profile")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var seller = await _context.Sellers
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound(new { message = "Seller profile not found" });

        // Returning a flattened object for easier consumption by the React/Vue frontend
        return Ok(new
        {
            sellerId            = seller.SellerId,
            businessName        = seller.BusinessName,
            businessDescription = seller.BusinessDescription,
            businessAddress     = seller.BusinessAddress,
            city                = seller.City,
            district            = seller.District,
            phoneNumber         = seller.PhoneNumber,
            website             = seller.Website,
            businessHours       = seller.BusinessHours,
            logoUrl             = seller.LogoUrl,
            facebookUrl         = seller.FacebookUrl,
            instagramUrl        = seller.InstagramUrl,
            isVerified          = seller.IsVerified,
            kycDocumentPath     = seller.KycDocumentPath,
            createdAt           = seller.CreatedAt,
            verifiedAt          = seller.VerifiedAt,
            rejectionReason     = seller.RejectionReason,
            ownerName           = seller.User.FullName,
            ownerEmail          = seller.User.Email,
        });
    }

    // Updates the business-related metadata for the seller.
    // PUT: api/Seller/profile
    [HttpPut("profile")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> UpdateProfile([FromBody] CompleteSellerProfileDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound("Seller not found");

        // Direct mapping of updated business contact and social information
        seller.BusinessName        = dto.BusinessName;
        seller.BusinessDescription = dto.BusinessDescription;
        seller.BusinessAddress     = dto.BusinessAddress;
        seller.City                = dto.City;
        seller.District            = dto.District;
        seller.PhoneNumber         = dto.PhoneNumber;
        seller.Website             = dto.Website;
        seller.BusinessHours       = dto.BusinessHours;
        seller.FacebookUrl         = dto.FacebookUrl;
        seller.InstagramUrl        = dto.InstagramUrl;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Profile updated successfully." });
    }

    // POST: api/Seller/complete-profile (kept for backwards compat)
    [HttpPost("complete-profile")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> CompleteProfile([FromBody] CompleteSellerProfileDto dto)
    {
        return await UpdateProfile(dto);
    }

    /* Handles business logo uploads.
       Includes validation for file types, size constraints, and handles cleanup
       of previous logos to save storage space.
     */

    // POST: api/Seller/upload-logo
    [HttpPost("upload-logo")]
    [Authorize(Roles = "Seller")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadLogo([FromForm] LogoUploadDto dto)
    {
        var logo = dto.Logo;
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound("Seller not found");

        if (logo == null || logo.Length == 0)
            return BadRequest("No file provided.");

        // Validation Rule: Only modern, web-friendly image formats accepted
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(logo.ContentType.ToLower()))
            return BadRequest("Only JPEG, PNG, or WebP images are allowed.");

        // Validation Rule: Limit upload to 5MB to prevent storage bloat
        if (logo.Length > 5 * 1024 * 1024)
            return BadRequest("Image must be under 5MB.");

        var containerClient = GetContainerClient();

        // Delete old logo from Blob Storage if it exists
        if (!string.IsNullOrEmpty(seller.LogoUrl) && seller.LogoUrl.Contains("blob.core.windows.net"))
        {
            try
            {
                var oldUri = new Uri(seller.LogoUrl);
                var oldBlobName = string.Join("/", oldUri.Segments[2..]);
                await containerClient.GetBlobClient(oldBlobName).DeleteIfExistsAsync();
            }
            catch { /* ignore delete errors */ }
        }

        // Generate a unique filename using SellerID and Ticks to prevent caching/naming conflicts
        var ext = Path.GetExtension(logo.FileName);
        var fileName = $"logos/seller_{seller.SellerId}_{DateTime.UtcNow.Ticks}{ext}";
        var blobClient = containerClient.GetBlobClient(fileName);

        using var stream = logo.OpenReadStream();
        await blobClient.UploadAsync(stream, overwrite: true);

        seller.LogoUrl = blobClient.Uri.ToString();
        await _context.SaveChangesAsync();

        return Ok(new { message = "Logo uploaded.", logoUrl = seller.LogoUrl });
    }

    // Removes the seller's business logo and deletes the file from Blob Storage.
    // DELETE: api/Seller/delete-logo
    [HttpDelete("delete-logo")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> DeleteLogo()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound("Seller not found");

        if (string.IsNullOrEmpty(seller.LogoUrl))
            return BadRequest("No logo to delete.");

        // Locate and delete file from Blob Storage
        if (seller.LogoUrl.Contains("blob.core.windows.net"))
        {
            try
            {
                var oldUri = new Uri(seller.LogoUrl);
                var oldBlobName = string.Join("/", oldUri.Segments[2..]);
                await GetContainerClient().GetBlobClient(oldBlobName).DeleteIfExistsAsync();
            }
            catch { /* ignore delete errors */ }
        }

        seller.LogoUrl = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Logo deleted." });
    }

    /* Processes KYC (Know Your Customer) document submissions.
       Expects a business license and ID document for manual admin verification.
     */

    // POST: api/Seller/upload-kyc
    [HttpPost("upload-kyc")]
    [Authorize(Roles = "Seller")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadKyc([FromForm] UploadKycDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound("Seller not found");

        if (dto.BusinessLicense == null || dto.IdDocument == null)
            return BadRequest("Missing documents");

        var containerClient = GetContainerClient();

        // Helper local function to handle asynchronous Blob Storage upload
        async Task<string> UploadToBlob(IFormFile file, string prefix)
        {
            var fileName = $"kyc/seller_{seller.SellerId}/{prefix}_{DateTime.UtcNow.Ticks}{Path.GetExtension(file.FileName)}";
            var blobClient = containerClient.GetBlobClient(fileName);
            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, overwrite: true);
            return blobClient.Uri.ToString();
        }

        seller.KycDocumentPath = await UploadToBlob(dto.BusinessLicense, "business_license");
        await UploadToBlob(dto.IdDocument, "id_document");

        // Reset verification status if they are re-uploading documents
        seller.IsVerified = false;
        seller.RejectionReason = null;

        await _context.SaveChangesAsync();
        return Ok(new { message = "KYC Uploaded", profile = seller });
    }

    /* Generates a comprehensive analytics report for the seller's dashboard.
       Aggregates data from orders, products, and reviews to provide
       insights into revenue, stock levels, and customer satisfaction.
     */

    // GET: api/Seller/analytics
    [HttpGet("analytics")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetAnalytics()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound();

        // Step 1: Query orders that contain at least one item from this seller
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .Where(o => o.OrderItems.Any(oi => oi.Product.SellerId == seller.SellerId))
            .ToListAsync();

        // Step 2: Query all active products belonging to the seller for stock/review tracking
        var products = await _context.Products
            .Include(p => p.Reviews)
            .Include(p => p.OrderItems)
            .Where(p => p.SellerId == seller.SellerId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        // Step 3: Calculate Lifetime Revenue (excluding cancelled orders)
        var totalRevenue = orders
            .Where(o => o.Status != "Cancelled")
            .SelectMany(o => o.OrderItems.Where(oi => oi.Product.SellerId == seller.SellerId))
            .Sum(oi => oi.UnitPrice * oi.Quantity);

        // Step 4: Calculate Revenue for the current calendar month
        var thisMonth = DateTime.UtcNow.Month;
        var thisYear = DateTime.UtcNow.Year;
        var monthlyRevenue = orders
            .Where(o => o.Status != "Cancelled" && o.CreatedAt.Month == thisMonth && o.CreatedAt.Year == thisYear)
            .SelectMany(o => o.OrderItems.Where(oi => oi.Product.SellerId == seller.SellerId))
            .Sum(oi => oi.UnitPrice * oi.Quantity);

        // Step 5: Group orders for the status distribution chart
        var ordersByStatus = orders
            .GroupBy(o => o.Status)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToList();

        // Step 6: Generate revenue timeline for the last 6 months (Trend Analysis)
        var monthlyData = Enumerable.Range(0, 6)
            .Select(i => {
                var date = DateTime.UtcNow.AddMonths(-i);
                var rev = orders
                    .Where(o => o.Status != "Cancelled" && o.CreatedAt.Month == date.Month && o.CreatedAt.Year == date.Year)
                    .SelectMany(o => o.OrderItems.Where(oi => oi.Product.SellerId == seller.SellerId))
                    .Sum(oi => oi.UnitPrice * oi.Quantity);
                return new { month = date.ToString("MMM yyyy"), revenue = rev };
            })
            .Reverse()
            .ToList();

        // Step 7: Identify the Top 5 Products by their individual revenue contribution
        var topProducts = products
            .Select(p => new {
                p.ProductId,
                p.Name,
                p.Price,
                p.StockQuantity,
                TotalSold     = p.OrderItems?.Sum(oi => oi.Quantity) ?? 0,
                Revenue       = p.OrderItems?.Sum(oi => oi.UnitPrice * oi.Quantity) ?? 0,
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                TotalReviews  = p.Reviews.Count
            })
            .OrderByDescending(p => p.Revenue)
            .Take(5)
            .ToList();

        // Step 8: Flag products nearing stock exhaustion (Threshold = 5 units)
        var lowStock = products
            .Where(p => p.StockQuantity <= 5)
            .Select(p => new { p.ProductId, p.Name, p.StockQuantity, p.Price })
            .ToList();

        return Ok(new {
            totalRevenue,
            monthlyRevenue,
            totalOrders    = orders.Count,
            totalProducts  = products.Count,
            averageRating  = products.Any(p => p.Reviews.Any())
                ? products.SelectMany(p => p.Reviews).Average(r => (double)r.Rating)
                : 0,
            totalReviews   = products.Sum(p => p.Reviews.Count),
            ordersByStatus,
            monthlyData,
            topProducts,
            lowStock
        });
    }

    // ==========================================================================
    // ADMIN ACTIONS (Oversight and Public Highlights)
    // ==========================================================================

    // GET: api/Seller/verified
    // Used by the homepage to show verified artisans
    [HttpGet("verified")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVerifiedSellers([FromQuery] int count = 6)
    {
        var sellers = await _context.Sellers
            .Include(s => s.Products)
                .ThenInclude(p => p.Reviews)
            .Where(s => s.IsVerified)
            .OrderByDescending(s => s.VerifiedAt)
            .Take(count)
            .ToListAsync();

        var result = sellers.Select(s => new
        {
            s.SellerId,
            s.BusinessName,
            s.City,
            s.District,
            s.LogoUrl,
            TotalProducts = s.Products.Count(p => p.IsActive),
            AverageRating = s.Products.SelectMany(p => p.Reviews).Any()
                ? s.Products.SelectMany(p => p.Reviews).Average(r => (double)r.Rating)
                : 0,
            TotalReviews = s.Products.SelectMany(p => p.Reviews).Count(),
        });

        return Ok(result);
    }

    // Lists all sellers currently waiting for KYC approval.
    // GET: api/Seller/pending
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPendingSellers()
    {
        var pendingSellers = await _context.Sellers
            .Include(s => s.User)
            .Where(s => !s.IsVerified && s.KycDocumentPath != null && s.RejectionReason == null)
            .Select(s => new
            {
                s.SellerId,
                s.BusinessName,
                s.City,
                s.District,
                s.KycDocumentPath,
                s.CreatedAt,
                UserEmail    = s.User.Email,
                UserFullName = s.User.FullName
            })
            .ToListAsync();

        return Ok(pendingSellers);
    }

    // Allows admins to approve or reject a seller's application.
    // PUT: api/Seller/verify/{sellerId}
    [HttpPut("verify/{sellerId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> VerifySeller(int sellerId, [FromBody] VerificationDto dto)
    {
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.SellerId == sellerId);
        if (seller == null) return NotFound("Seller not found");

        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (dto.IsApproved)
        {
            seller.IsVerified      = true;
            seller.VerifiedAt      = DateTime.UtcNow;
            seller.VerifiedBy      = adminId;
            seller.RejectionReason = null;
        }
        else
        {
            // If rejected, the seller stays unverified and receives a reason
            seller.IsVerified      = false;
            seller.RejectionReason = dto.RejectionReason;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = dto.IsApproved ? "Seller Verified" : "Seller Rejected" });
    }

    // ── Private helper: creates a reusable Blob container client ──
    private BlobContainerClient GetContainerClient()
    {
        var connectionString  = _configuration["AzureStorage:ConnectionString"];
        var containerName     = _configuration["AzureStorage:ContainerName"];
        var blobServiceClient = new BlobServiceClient(connectionString);
        return blobServiceClient.GetBlobContainerClient(containerName);
    }
}