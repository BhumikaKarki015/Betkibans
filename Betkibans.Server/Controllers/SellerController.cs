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
    public async Task<IActionResult> UploadLogo([FromForm] IFormFile logo)
    {
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
            TotalProducts = s.Products.Count(p => p.IsActive),
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