using Betkibans.Server.Data;
using Betkibans.Server.DTOs.Seller;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SellerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public SellerController(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    // ===========================
    // SELLER ACTIONS
    // ===========================

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

        return Ok(new
        {
            sellerId        = seller.SellerId,
            businessName    = seller.BusinessName,
            businessDescription = seller.BusinessDescription,
            businessAddress = seller.BusinessAddress,
            city            = seller.City,
            district        = seller.District,
            phoneNumber     = seller.PhoneNumber,
            website         = seller.Website,
            businessHours   = seller.BusinessHours,
            logoUrl         = seller.LogoUrl,
            facebookUrl     = seller.FacebookUrl,
            instagramUrl    = seller.InstagramUrl,
            isVerified      = seller.IsVerified,
            kycDocumentPath = seller.KycDocumentPath,
            createdAt       = seller.CreatedAt,
            verifiedAt      = seller.VerifiedAt,
            rejectionReason = seller.RejectionReason,
            ownerName       = seller.User.FullName,
            ownerEmail      = seller.User.Email,
        });
    }

    // PUT: api/Seller/profile
    [HttpPut("profile")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> UpdateProfile([FromBody] CompleteSellerProfileDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound("Seller not found");

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

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(logo.ContentType.ToLower()))
            return BadRequest("Only JPEG, PNG, or WebP images are allowed.");

        if (logo.Length > 5 * 1024 * 1024)
            return BadRequest("Image must be under 5MB.");

        var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "logos");
        if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

        // Delete old logo if exists
        if (!string.IsNullOrEmpty(seller.LogoUrl))
        {
            var oldPath = Path.Combine(_environment.WebRootPath, seller.LogoUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        var ext = Path.GetExtension(logo.FileName);
        var fileName = $"seller_{seller.SellerId}_{DateTime.Now.Ticks}{ext}";
        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await logo.CopyToAsync(stream);
        }

        seller.LogoUrl = $"/uploads/logos/{fileName}";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Logo uploaded.", logoUrl = seller.LogoUrl });
    }
    
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

        var filePath = Path.Combine(_environment.WebRootPath, seller.LogoUrl.TrimStart('/'));
        if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

        seller.LogoUrl = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Logo deleted." });
    }

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

        var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "kyc", $"seller_{seller.SellerId}");
        if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

        async Task<string> SaveFile(IFormFile file)
        {
            var fileName = $"{DateTime.Now.Ticks}_{file.FileName}";
            var filePath = Path.Combine(uploadPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create)) { await file.CopyToAsync(stream); }
            return $"/uploads/kyc/seller_{seller.SellerId}/{fileName}";
        }

        seller.KycDocumentPath = await SaveFile(dto.BusinessLicense);
        await SaveFile(dto.IdDocument);

        seller.IsVerified = false;
        seller.RejectionReason = null;

        await _context.SaveChangesAsync();
        return Ok(new { message = "KYC Uploaded", profile = seller });
    }


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

        // All orders for this seller
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .Where(o => o.OrderItems.Any(oi => oi.Product.SellerId == seller.SellerId))
            .ToListAsync();

        // All products
        var products = await _context.Products
            .Include(p => p.Reviews)
            .Include(p => p.OrderItems)
            .Where(p => p.SellerId == seller.SellerId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        // Revenue calculations
        var totalRevenue = orders
            .Where(o => o.Status != "Cancelled")
            .SelectMany(o => o.OrderItems.Where(oi => oi.Product.SellerId == seller.SellerId))
            .Sum(oi => oi.UnitPrice * oi.Quantity);

        var thisMonth = DateTime.UtcNow.Month;
        var thisYear = DateTime.UtcNow.Year;
        var monthlyRevenue = orders
            .Where(o => o.Status != "Cancelled" && o.CreatedAt.Month == thisMonth && o.CreatedAt.Year == thisYear)
            .SelectMany(o => o.OrderItems.Where(oi => oi.Product.SellerId == seller.SellerId))
            .Sum(oi => oi.UnitPrice * oi.Quantity);

        // Orders by status
        var ordersByStatus = orders
            .GroupBy(o => o.Status)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToList();

        // Monthly revenue for last 6 months
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

        // Top products by revenue
        var topProducts = products
            .Select(p => new {
                p.ProductId,
                p.Name,
                p.Price,
                p.StockQuantity,
                TotalSold = p.OrderItems?.Sum(oi => oi.Quantity) ?? 0,
                Revenue = p.OrderItems?.Sum(oi => oi.UnitPrice * oi.Quantity) ?? 0,
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                TotalReviews = p.Reviews.Count
            })
            .OrderByDescending(p => p.Revenue)
            .Take(5)
            .ToList();

        // Low stock products
        var lowStock = products
            .Where(p => p.StockQuantity <= 5)
            .Select(p => new { p.ProductId, p.Name, p.StockQuantity, p.Price })
            .ToList();

        return Ok(new {
            totalRevenue,
            monthlyRevenue,
            totalOrders = orders.Count,
            totalProducts = products.Count,
            averageRating = products.Any(p => p.Reviews.Any()) 
                ? products.SelectMany(p => p.Reviews).Average(r => (double)r.Rating) 
                : 0,
            totalReviews = products.Sum(p => p.Reviews.Count),
            ordersByStatus,
            monthlyData,
            topProducts,
            lowStock
        });
    }

    // ===========================
    // ADMIN ACTIONS
    // ===========================
    
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
            seller.IsVerified      = false;
            seller.RejectionReason = dto.RejectionReason;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = dto.IsApproved ? "Seller Verified" : "Seller Rejected" });
    }
}